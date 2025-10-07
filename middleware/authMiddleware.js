// script.js
// This file must be loaded as module after firebase.js in each page that needs Firebase.
// Example in HTML: <script type="module" src="firebase.js"></script>
//                 <script type="module" src="script.js"></script>

import { auth, firebaseUtils, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

/*
  Behavior:
  - User signs-in with Google on login page.
  - Home page shows list of available chats (static demo list).
  - Opening chat sets up onSnapshot listener on collection: "ephemeral_messages/{chatId}/messages"
  - When sending a message: we addDoc(...) then schedule deleteDoc(docRef) after TTL_MS.
  - Thus messages are transient and removed after TTL_MS seconds.
*/

const CHAT_TTL_SEC = 8; // messages will be deleted after 8 seconds (adjustable)

// simple demo chat rooms:
const ROOM_LIST = [
  { id: 'general', title: 'General Chat', avatar: 'https://i.pravatar.cc/48?u=general' },
  { id: 'design', title: 'Design Team', avatar: 'https://i.pravatar.cc/48?u=design' },
  { id: 'saved', title: 'Saved Messages', avatar: 'https://i.pravatar.cc/48?u=saved' },
];

// Utility - get current user info from Firebase Auth
export function getCurrentUserInfo() {
  const u = auth.currentUser;
  if (!u) return null;
  return { uid: u.uid, name: u.displayName || u.email, photo: u.photoURL || `https://i.pravatar.cc/48?u=${u.uid}` };
}

/* =================== Login page helpers =================== */
export async function startGoogleLogin() {
  try {
    await firebaseUtils.signInWithGoogle();
    // After sign-in, onAuthStateChanged in pages will redirect accordingly
  } catch (err) {
    alert('Google sign-in failed: ' + err.message);
    console.error(err);
  }
}

export function doSignOut() {
  firebaseUtils.signOut();
}

/* =================== Home page render =================== */
export function populateHomePage() {
  // ensure authenticated
  if (!auth.currentUser) { window.location.href = 'login.html'; return; }
  const user = getCurrentUserInfo();
  // show username on sidebar
  const elName = document.getElementById('userNameDisplay');
  if (elName) elName.innerText = user.name;

  const container = document.getElementById('chatList');
  container.innerHTML = '';
  ROOM_LIST.forEach(r => {
    const div = document.createElement('div');
    div.className = 'chat-item';
    div.innerHTML = `
      <img src="${r.avatar}" alt="">
      <div class="meta">
        <div class="title">${r.title}</div>
        <div class="last">Tap to open</div>
      </div>
    `;
    div.addEventListener('click', () => {
      // set active room and go to chat
      localStorage.setItem('activeRoom', r.id);
      window.location.href = 'chat.html';
    });
    container.appendChild(div);
  });
}

/* =================== Chat page logic =================== */

let currentUnsub = null;

export function initChatPage() {
  // auth guard
  if (!auth.currentUser) { window.location.href = 'login.html'; return; }

  const roomId = localStorage.getItem('activeRoom');
  if (!roomId) { window.location.href = 'home.html'; return; }

  const room = ROOM_LIST.find(r => r.id === roomId) || { id: roomId, title: roomId, avatar: `https://i.pravatar.cc/48?u=${roomId}` };
  document.getElementById('chatTitle').innerText = room.title;
  document.getElementById('chatAvatar').src = room.avatar;

  // listen for messages
  const messagesDiv = document.getElementById('messages');

  // unsubscribe previous if any
  if (currentUnsub) currentUnsub();

  const msgsCol = collection(db, 'ephemeral_messages', room.id, 'messages');
  const q = query(msgsCol, orderBy('createdAt', 'asc'));
  currentUnsub = onSnapshot(q, snapshot => {
    // render messages
    messagesDiv.innerHTML = '';
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const el = document.createElement('div');
      const fromMe = (data.senderUid === auth.currentUser.uid);
      el.className = 'msg ' + (fromMe ? 'sent' : 'received');
      el.innerHTML = `
        <div style="font-size:13px; font-weight:600; margin-bottom:6px;">${data.senderName}</div>
        <div>${escapeHtml(data.text)}</div>
        <div style="font-size:11px; color:rgba(0,0,0,0.45); margin-top:6px;">${formatTime(data.createdAt?.toDate?.() || new Date())}</div>
      `;
      messagesDiv.appendChild(el);
    });
    // scroll
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

function formatTime(d) {
  if (!d) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export async function sendEphemeralMessage(text) {
  const roomId = localStorage.getItem('activeRoom');
  if (!roomId) return;
  if (!text || !text.trim()) return;
  const user = getCurrentUserInfo();
  if (!user) return;

  try {
    const colRef = collection(db, 'ephemeral_messages', roomId, 'messages');
    const docRef = await addDoc(colRef, {
      senderUid: user.uid,
      senderName: user.name,
      text: text,
      createdAt: serverTimestamp()
    });
    // schedule deletion after TTL
    setTimeout(async () => {
      try {
        await deleteDoc(doc(db, 'ephemeral_messages', roomId, 'messages', docRef.id));
      } catch (e) {
        // could have been already deleted
        // console.warn('delete failed', e);
      }
    }, CHAT_TTL_SEC * 1000);
  } catch (err) {
    console.error('sendEphemeralMessage error', err);
  }
}

/* =================== Profile page =================== */
export function populateProfilePage() {
  if (!auth.currentUser) { window.location.href = 'login.html'; return; }
  const user = getCurrentUserInfo();
  document.getElementById('profileName').innerText = user.name;
  const img = document.getElementById('profileAvatar');
  if (img) img.src = user.photo;
}

/* =================== General auth watcher for redirects =================== */
onAuthStateChanged(auth, user => {
  // if on login.html and user logged in -> go to home
  if (user && window.location.pathname.endsWith('login.html')) {
    window.location.href = 'home.html';
  }
  // if on any protected page and not logged in -> login
  const protectedPages = ['home.html', 'chat.html', 'profile.html'];
  if (!user && protectedPages.some(p => window.location.pathname.endsWith(p))) {
    window.location.href = 'login.html';
  }
});

/* =================== Small helpers for attaching to buttons in HTML =================== */
window.startGoogleLogin = startGoogleLogin;
window.doSignOut = doSignOut;
window.populateHomePage = populateHomePage;
window.initChatPage = initChatPage;
window.sendEphemeralMessage = async () => {
  const input = document.getElementById('msgBox');
  if (!input) return;
  await sendEphemeralMessage(input.value);
  input.value = '';
};
window.populateProfilePage = populateProfilePage;
