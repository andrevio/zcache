# ZCache - simple yet high performance JavaScript cache library
It uses a "linked hash map" data structure, which allows for constant time (or amortized O(1) notation) for all operations.

## Motivation
Often cache expiration policy is implemented using a queue. That approach, however, is not efficient when needing to reset 
the expiration timer since the whole queue needs to be scanned to find the corresponding element. ZCache, on the other hand,
uses a linked hash map that acts both as a hash map and a linked list. When accessing an element bay calling cache.get(key),
that element is then places to the back of the list. This approach accumilates all of the expired items at the front of the
list, allowing for efficient removal of expired items.

## Example Usage
```JavaScript
var cache = ZCache.getInstance(60); // items expire after 60 seconds
cache.put(1, "a");
cache.put(2, "b");

var a = cache.get(1); // returns "a"
```

## Supported Operations
* put(key, value)
* get(key)
* remove(key)
* contains(key)
* clear()
* list()
