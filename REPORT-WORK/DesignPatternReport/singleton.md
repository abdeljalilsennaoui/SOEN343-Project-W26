# Singleton Pattern
---

The Singleton pattern is used to ensure that only one instance of the EventBus exists across the system and that there is a global point of access to that instance, allowing all publishers and subscribers to communicate through the same shared instance. This is essential for maintaining the correct behaviour of the Observer pattern, since multiple EventBus instances would prevent events from being properly distributed. In Node.js, this is achieved through module caching by exporting a single instance, ensuring consistency without requiring a getInstance() method. Without using the Singleton pattern, multiple instances could be created, leading to broken communication between components and making the system harder to maintain.
