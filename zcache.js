/**
 * @license: free, as in "free beer"
 * @author: Andre Violentyev
 */
(function(){
    "use strict";

    return {
        /**
         * Creates an instance of a Cache object and returns it
         *
         * @param {Number} expireInSeconds - optional sliding expiration time in second. "get()" resets the timer.
         * @returns {Cache} with the following methods:
         *      put(key, value)
         *      get(key)
         *      remove(key)
         *      contains(key)
         *      clear()
         *      list()
         */
        getInstance: function(expireInSeconds) {
            "use strict";

            expireInSeconds = expireInSeconds || -1;

            /**
             C contains objects with linkes to previous and next nodes, as well as Date to indicate when the value
             * was originally placed into the map.
             *
             */
            var map = {}; // "linked hash map" where every element is double-linked to its neighbors
            var first = null;
            var last = null;

            function isExpired(o) {
                "use strict";
                if (expireInSeconds < 0) {
                    return false; // not expiring any items
                }

                var currTime = new Date().getTime();
                var expireInMilliSeconds = expireInSeconds * 1000;
                var putTime = o.date.getTime();

                return currTime - putTime > expireInMilliSeconds;
            }

            /**
             * walks from the beginning of the queue and deletes all expired items
             */
            function removeAllExpired() {
                "use strict";
                var second = null;
                /**
                 * since the items are linked in the order they were put into the map,
                 * we can stop as soon as we find the first non-expired item
                 */
                while (first !== null && isExpired(first)) {
                    if (first.next !== null) {
                        second = first.next;
                        second.prev = null;
                        delete map[first.key];
                        first = second;
                    } else {
                        // deleting the last element in the list
                        delete map[first.key];
                        first = null;
                        last = null;
                    }
                }
            }

            /**
             * plucks the object from the middle of the queue and places it at the end
             * @param o
             */
            function moveToEndOfQueue(o) {
                "use strict";
                var prev = o.prev;
                var next = o.next;

                if (last === o) { // already the last element, nothing to do
                    return;
                }

                /**
                 * especial case when moving the first item to the end
                 */
                if (first === o && o.next !== null) {
                    first = o.next;
                }

                if (last !== null) {
                    last.next = o;
                }
                last = o;


                /**
                 * at this point first and last are correctly linked
                 * now we need to patch up the hole in the list
                 */
                if (prev !== null) {
                    prev.next = next;
                }

                if (next !== null) {
                    next.prev = prev;
                }

                o.next = null;
                o.prev = next;
            }

            /**
             *
             * @type {{put: Function, get: Function, remove: Function, contains: Function, clear: Function}}
             */
            var cache = {
                /**
                 * @param key
                 * @param item
                 */
                put: function(key, item) {
                    "use strict";

                    // we remove expired on each put operation to minimize memory usage due to expired items
                    removeAllExpired();

                    if (map[key] !== undefined) { // collision
                        this.remove(key);
                    }

                    var o = {
                        key: key,
                        item: item,
                        date: new Date(),
                        next: null, // null since it's going to the end of the queue
                        prev: last
                    };

                    map[key] = o;

                    /**
                     * link to the end of the queue
                     */
                    if (last !== null) {
                        last.next = o;
                    }

                    last = o;

                    if (first === null) {
                        first = o;
                    }
                },

                /**
                 * @param key
                 * @returns {*}
                 */
                get: function(key) {
                    "use strict";

                    //uncomment to minimize memory usage but marginally increase get() time
                    //removeAllExpired();

                    var o = map[key];

                    if (o !== undefined && !isExpired(o)) {
                        o.date = new Date(); // reset timer
                        moveToEndOfQueue(o);
                        return o.item;

                    } else {
                        /**
                         * detected an expired item; good time to check for other expired items
                         */
                        removeAllExpired();
                        return undefined; // undefined could also indicate "not found" or "expired"
                    }
                },

                /**
                 * @param key
                 * @returns {*}
                 */
                remove: function(key) {
                    "use strict";

                    var o = map[key];
                    var prev = null;
                    var next = null;

                    if (o !== undefined) {
                        prev = o.prev;
                        next = o.next;

                        if (prev !== null) {
                            prev.next = next;
                        } else {
                            // removing the very first item, so adjust 'first' pointer
                            first = next;
                        }

                        if (next !== null) {
                            next.prev = prev;
                        } else {
                            // removing the very last item, so adjust 'last' pointer
                            last = prev;
                        }
                        delete map[key];
                        return o.item;
                    } else {
                        return undefined;
                    }
                },

                /**
                 *
                 * @param key
                 * @returns {boolean}
                 */
                contains: function(key){
                    "use strict";
                    return key in map;
                },

                /**
                 * removes all elements from the cache
                 */
                clear: function() {
                    "use strict";
                    var key;
                    for (key in map) {
                        if (map.hasOwnProperty(key)) {
                            delete map[key];
                        }
                    }

                    first = null;
                    last = null;
                },

                /**
                 * @returns {Array} of all values currently in the cache (even if expired)
                 */
                list: function() {
                    "use strict";
                    var ar = [];
                    var curr = first;
                    while (curr !== null) {
                        ar.push(map[curr.key].item);
                        curr = curr.next;
                    }

                    return ar;
                }
            };

            return cache;
        }
    }
}());
