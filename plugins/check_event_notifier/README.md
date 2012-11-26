check_event_notifier
======

Features
--------

* Notify Check Event

Installing
-----------------

One line install:

    > npm install plugins/check_event_notifier/

Activate plugin:

    > vi ./plugins/index.js
      // in plugins/index.js
      exports.init = function() {
        // require('./console').init();
        require('./check_event_notifier').init();
      }
