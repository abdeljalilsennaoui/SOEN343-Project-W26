# Overview of Main Use Cases

---

To be able to design the system itself, one of the first diagrams that was completed was the use case diagram. It allowed the team to focus on what the SUMMS platform’s main interactions are when it comes to its core actors. More specifically, the main actors are the **Commuter**, the **Mobility Provider**, the **City Administrator**, and the **System Administrator**. Every single one of the actors interacts with the system in different ways and depending on their goals, the use cases differ quite significantly. Listed below are the main cases for each of the actors and a short description of the goals.

---

## Main Actor 1: The Commuter

### Authenticate User
Allowing the commuter to login and access the system’s platform with the accesses linked to their role. It is important to note that this specific case is necessary for each of the main actors which signin/login on the platform.

### Search Mobility Options
Allowing the commuter to search for available transportation options by using filters. The filters themselves can be for mobility type, city, pricing, and time window.

### Book Mobility Service
Allowing the commuter to pick a mobility option, selecting a time and location, confirming the booking, and also complete the payment process. This also involves the secondary actor **Payment Service**.

### Search Parking Location
Allowing the commuter to search and find parking locations on the map as well as view the availability and pricing information. This also involves the secondary actor **Parking Service**.

### View Public Transportation Information
Allowing the commuter to see transit routes, schedules, and also view the stop locations depending on the origin and destination of the user. This also involves the secondary actor **Public Transportation Service**.

---

## Main Actor 2: The Mobility Provider

### Manage Fleet
Allowing the mobility provider to manage the different vehicles offered through the platform. This actor can add, update, or remove fleet information.

---

## Main Actor 3: City Administrator

### View Rental Statics
Allowing the city administrator actor to access the analytics related to the rentals, to see data like the amount of rentals per city, and per mobility type.

### View Service Access Statistics
Allowing the actor to view gateway or service-level analytics, showing how many times the system’s services are accessed.

---

## Main Actor 4: System Administrator

### Manage User Accounts
Allowing the actor to create, update, and deactivate other user accounts within the system.