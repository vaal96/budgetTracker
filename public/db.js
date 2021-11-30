const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
  target.result.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
  db = target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
  
  const transaction = db.transaction(['pending'], 'readwrite');
  const pending = transaction.objectStore('pending');

  console.log(record);

  pending.add(record);
}

function checkDatabase() {
  
  const transaction = db.transaction(['pending'], 'readwrite');
  const pending = transaction.objectStore('pending');

  const getAll = pending.getAll();
  getAll.onsuccess = async () => {
    if (getAll.result.length === 0) {
     
      return;
    }
    
    const response = await fetch("/api/transaction/bulk", {
      method: "POST",
      body: JSON.stringify(getAll.result),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
    });
    
    const dbTransactions = await response.json();
    if (dbTransactions.length > 0) {
      const transaction = db.transaction(['pending'], 'readwrite');
      const pending = transaction.objectStore('pending');
      
      pending.clear();
    }
  };
}

window.addEventListener('online', checkDatabase);