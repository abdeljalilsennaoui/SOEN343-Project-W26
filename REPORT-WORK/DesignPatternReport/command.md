# Command Pattern

---

The command pattern is a good way to decouple request handling when executing business logic in the system. Instead of doing a crowded request-specific behavior list inside of the MobilityRequestHandler, every request is encapsulated as its own command object so the system can execute(request) the operation. That way, the handler can be set as an invoker, while the MobilityService acts like the receiver performing the operation. In SUMMS, CommandRegistry maps the request types to their correct command object, allowing the system to be more maintainable, flexible, and makes it easier to add more requests as the system grows without changing the main logic. Without this pattern, MobilityRequestHandler would depend on all request flows and business operations, which tightly couples the code, making it harder to extend.
