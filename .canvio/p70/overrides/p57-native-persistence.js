/* CANVIO P57 — Native persistence diagnostics. Additive; never changes DB schema. */
(function () {
  'use strict';
  var DB_NAME = 'CANVIO_81_MEDIA';
  var STORE_NAME = 'media';
  var lastReport = null;

  function storageInfo() {
    var storage = navigator && navigator.storage;
    return Promise.all([
      storage && typeof storage.estimate === 'function'
        ? Promise.resolve(storage.estimate()).catch(function () { return null; })
        : Promise.resolve(null),
      storage && typeof storage.persisted === 'function'
        ? Promise.resolve(storage.persisted()).catch(function () { return null; })
        : Promise.resolve(null)
    ]).then(function (values) {
      var estimate = values[0];
      return {
        usage: estimate && Number.isFinite(estimate.usage) ? estimate.usage : null,
        quota: estimate && Number.isFinite(estimate.quota) ? estimate.quota : null,
        persisted: typeof values[1] === 'boolean' ? values[1] : null
      };
    });
  }

  function openExistingDatabase() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('IndexedDB không khả dụng trong context này.'));
      var request;
      var createdByProbe = false;
      var settled = false;
      function fail(error) {
        if (settled) return;
        settled = true;
        reject(error);
      }
      try { request = window.indexedDB.open(DB_NAME); }
      catch (error) { fail(error); return; }
      request.onupgradeneeded = function () {
        // Opening a missing database without a version would create it. Abort that
        // upgrade so this diagnostic can never manufacture a replacement store.
        createdByProbe = true;
        try { request.transaction.abort(); } catch (error) {}
      };
      request.onsuccess = function () {
        var db = request.result;
        // A request may succeed after an earlier "blocked" event rejected the
        // promise. Close that late connection instead of leaking an open handle.
        if (settled) {
          try { db.close(); } catch (error) {}
          return;
        }
        if (createdByProbe) {
          try { db.close(); } catch (error) {}
          fail(new Error('Không tìm thấy kho media đã tồn tại; không tạo database mới.'));
          return;
        }
        if (!db.objectStoreNames || !db.objectStoreNames.contains(STORE_NAME)) {
          try { db.close(); } catch (error) {}
          fail(new Error('Database hiện có nhưng thiếu object store media; không tự nâng schema.'));
          return;
        }
        db.onversionchange = function () { try { db.close(); } catch (error) {} };
        settled = true;
        resolve(db);
      };
      request.onerror = function () {
        fail(request.error || new Error(createdByProbe ? 'Database media chưa tồn tại.' : 'Không mở được database media.'));
      };
      request.onblocked = function () {
        fail(new Error('Database đang bị khóa bởi tab khác. Đóng các tab CANVIO khác rồi thử lại.'));
      };
    });
  }

  function inspect() {
    return Promise.all([storageInfo(), Promise.resolve().then(openExistingDatabase).then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx, countRequest, counted = false, count = null, settled = false;
        function finish(error) {
          if (settled) return;
          settled = true;
          try { db.close(); } catch (closeError) {}
          if (error) { reject(error); return; }
          if (!counted) { reject(new Error('Giao dịch kiểm tra IndexedDB kết thúc mà không có kết quả đếm.')); return; }
          resolve({ database: DB_NAME, version: db.version, store: STORE_NAME, mediaRecords: count });
        }
        try { tx = db.transaction(STORE_NAME, 'readonly'); }
        catch (error) { finish(error); return; }
        try { countRequest = tx.objectStore(STORE_NAME).count(); }
        catch (error) { try { tx.abort(); } catch (abortError) {} finish(error); return; }
        countRequest.onsuccess = function () {
          count = countRequest.result;
          counted = true;
        };
        countRequest.onerror = function () {
          finish(countRequest.error || new Error('Không đếm được media records.'));
        };
        tx.oncomplete = function () { finish(null); };
        tx.onerror = tx.onabort = function () {
          finish(tx.error || new Error('Giao dịch kiểm tra IndexedDB bị lỗi hoặc bị hủy.'));
        };
      });
    }).catch(function (error) { return { database: DB_NAME, available: false, error: error.message || String(error) }; })]).then(function (parts) {
      var storage = parts[0], db = parts[1];
      var report = {
        candidate: window.CANVIO_BUILD && window.CANVIO_BUILD.version || 'unknown',
        secureContext: !!(window.isSecureContext),
        indexedDB: !!window.indexedDB,
        database: db.database,
        databaseAvailable: db.available !== false,
        databaseVersion: db.version || null,
        objectStore: db.store || null,
        mediaRecords: Number.isFinite(db.mediaRecords) ? db.mediaRecords : null,
        storageUsageBytes: storage.usage,
        storageQuotaBytes: storage.quota,
        storagePersisted: storage.persisted,
        scope: { readOnly: true, schemaChanged: false, mediaWritten: false }
      };
      if (db.error) report.databaseError = db.error;
      lastReport = report;
      return JSON.parse(JSON.stringify(report));
    });
  }

  function roundTrip() {
    return openExistingDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        var id = '__canvio_p57_probe_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        var probe = new Blob(['CANVIO-P57-PERSISTENCE-PROBE'], { type: 'text/plain' });
        var verified = false;
        var cleaned = false;
        var tx;
        try {
          tx = db.transaction(STORE_NAME, 'readwrite');
          var store = tx.objectStore(STORE_NAME);
          store.add({ id: id, blob: probe });
          var request = store.get(id);
          request.onsuccess = function () {
            var row = request.result;
            verified = !!(row && row.id === id && row.blob && row.blob.size === probe.size && row.blob.type === probe.type);
            if (!verified) { try { tx.abort(); } catch (error) {} return; }
            store.delete(id);
            cleaned = true;
          };
          request.onerror = function () { try { tx.abort(); } catch (error) {} };
        } catch (error) { db.close(); reject(error); return; }
        tx.oncomplete = function () {
          db.close();
          resolve({ ok: verified && cleaned, verified: verified, cleanupScheduled: cleaned, scope: { temporaryRecordOnly: true, userMediaOverwritten: false, schemaChanged: false } });
        };
        tx.onerror = tx.onabort = function () {
          var error = tx.error || new Error('Giao dịch kiểm tra IndexedDB bị hủy.');
          db.close();
          reject(error);
        };
      });
    });
  }

  function requestPersistence() {
    var storage = navigator && navigator.storage;
    if (!storage || typeof storage.persist !== 'function') {
      return Promise.resolve({ supported: false, granted: false, message: 'Trình duyệt không cung cấp StorageManager.persist().' });
    }
    return Promise.resolve().then(function () { return storage.persist(); }).then(function (granted) {
      return { supported: true, granted: granted === true, message: granted ? 'Trình duyệt đã cấp persistent storage.' : 'Trình duyệt không cấp persistent storage; dữ liệu vẫn theo chính sách quota/eviction của trình duyệt.' };
    }).catch(function (error) {
      return { supported: true, granted: false, message: error && error.message || 'Không yêu cầu được persistent storage.' };
    });
  }

  window.CANVIOPersistenceAudit = {
    version: '57.0.0',
    inspect: inspect,
    roundTrip: roundTrip,
    requestPersistence: requestPersistence,
    last: function () { return lastReport ? JSON.parse(JSON.stringify(lastReport)) : null; },
    owner: { database: DB_NAME, store: STORE_NAME, schemaVersion: 1 }
  };

  var suite = window.CANVIOPhaseSuite;
  if (suite) {
    var previousTests = suite.tests;
    suite.version = '57.0.0';
    suite.tests = function () {
      var result = previousTests ? previousTests.apply(this, arguments) : {};
      result.p57NativePersistenceAudit = !!(window.CANVIOPersistenceAudit && window.CANVIOPersistenceAudit.inspect);
      result.p57SafeRoundTrip = !!(window.CANVIOPersistenceAudit && window.CANVIOPersistenceAudit.roundTrip);
      return result;
    };
  }
})();
