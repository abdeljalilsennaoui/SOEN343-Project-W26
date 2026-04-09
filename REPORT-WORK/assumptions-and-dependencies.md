# Assumptions and Dependencies

---

## Overview

To allow the system to operate appropriately, the assumptions and dependencies listed below define the main conditions which have to be met for **SUMMS** to behave correctly. They clarify the environment, the expectations of the system, as well as the other elements which the platform has to rely on to function as it should.

---

## Assumptions

- Users need a stable internet connection and a compatible web browser.
- Users only interact with the system through their specific roles defined upon the creation of their account. They can either be commuters, mobility providers, city administrators, or system administrators.
- Users are only able to access features and information shown to their assigned role groups.
- The data entered and managed by users, providers, and administrators is reasonably accurate and kept up to date.
- External mobility-related information is available through the system and is reliable enough for platform use.
- The platform is built in a way where the environment’s frontend and backend elements can communicate correctly with one another through web requests and responses.

---

## Dependencies

- The platform depends on the web-based frontend and backend working correctly in tandem as an integrated system.
- The system depends on the database being functional, available, and consistent in storing data for bookings, vehicles, users, analytics, parking, and any other core system information.
- Some features depend on external integrations. Some examples of this are mobility-related data sources, payment support, and mapping, among other things, which are integrated with supporting APIs.
- Some services depend on the availability of latest updated information. Things like bookings, transit, parking, and analytics must have the latest available information to behave in the expected manner.
- The quality of some of the system’s functions depend on the internal design of SUMMS itself, but also on the consistency and availability of external services it interacts with. That is also true for the data sources.