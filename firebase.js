import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
    getDatabase,
    ref,
    set,
    get,
    update,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyC1F7WClvfh1jqssXHBho9uGa1hBsKkwIc",
    authDomain: "identity-dd407.firebaseapp.com",
    databaseURL: "https://identity-dd407-default-rtdb.firebaseio.com",

    projectId: "identity-dd407",
    storageBucket: "identity-dd407.firebasestorage.app",
    messagingSenderId: "866697936339",
    appId: "1:866697936339:web:be61d4015b3beb5a0ec326",
    measurementId: "G-KFVDJ7P9H4",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
export async function setData(data, key, value) {
    await set(ref(db, data), {
        [key]: value,
    });
}

export async function getData(data) {
    const bulbsRef = ref(db, data);
    const snapshot = await get(bulbsRef);
    if (snapshot.exists()) {
        return snapshot.val();
    } else {
        return null;
    }
}

export async function incrementValue(path, key) {
    const data = (await getData(path)) || {};
    const current = data[key] || 0;
    const newValue = current + 1;

    await update(ref(db, path), { [key]: newValue });
    console.log(`Updated ${key} → ${newValue}`);
}
