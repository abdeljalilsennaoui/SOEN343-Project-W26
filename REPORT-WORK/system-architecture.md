# System Architecture 

The Smart Urban Mobility Management System (SUMMS) follows the Model-View-Controller (MVC) architectural pattern. This architecture was selected to ensure a clear separation of concerns between the user interface, business logic, and data management layers.
## System Components
The View layer is implemented using a React frontend
The Controller layer handles HTTP requests
The Model layer encapsulates business logic, domain entities, and database interactions.
This structure improves maintainability, scalability, and testability while supporting multiple user roles, including commuters, providers, and administrators.
##  1. View Layer (Frontend - React)
The View layer is responsible for rendering the user interface and handling user interactions.
It includes:
Commuter Views: booking flow, vehicle list, parking page, transit page, ride sharing
Provider Views: dashboard, vehicle management forms
Admin Views: admin dashboard, analytics report
The frontend communicates using HTTP requests.
##  2. Controller Layer
The Controller layer acts as the entry point for all user requests.
The main component:
MobilityController
Responsibilities:
Receives HTTP requests from the frontend
Validates input data
Creates a MobilityRequest object
Delegates processing to the MobilityRequestHandler
The controller does not contain business logic, ensuring low coupling and high maintainability.
##  3. Model Layer
The Model layer contains the core business logic and system data handling. It is composed of several components:
### a. Domain Entities
Represents core system objects:
User, Vehicle, Booking, Provider
ParkingFacility, ParkingSpot
MobilityOption, PaymentReceipt, AnalyticsEvent
These entities represent the system's core objects.
### b. Business Logic (Services)
The MobilityService is the central component handling business operations such as:
Vehicle search and filtering
Rental lifecycle
Payment processing
Parking reservation
Ride sharing
Analytics generation
Additional services include:
MobilitySearchService (optimized search)
AvailabilityService (checks availability)
### c. Request Handling
MobilityRequest: handles incoming requests (Input DTO)
MobilityResponse: standardized output format (Output DTO)
MobilityRequestHandler: routes requests to appropriate service operations
This ensures consistent request processing across the system.
### d. Data Access Layer
MobilityDataGateway handles all database interactions
MobilityDataMapper converts database records into domain entities
The system uses Google Firestore as its database, with collections such as:
users, vehicles, bookings, mobilityOptions, parkingFacilities, parkingSpots, paymentReceipts, analytics
This decouples business logic from database implementation.

###System Interaction Flow
The system follows a structured flow:
The user interacts with the frontend (View)
The View sends an HTTP request to the Controller
The Controller creates a MobilityRequest
The request is passed to the MobilityRequestHandler
The handler invokes the appropriate method in MobilityService
The service executes business logic 
The MobilityDataGateway queries the database
Data is mapped into domain entities using MobilityDataMapper
The MobilityResponse is returned to the MobilityRequestHandler
MobilityController forwards the response to the MobilityPresenter
The Presenter formats the response into a ViewModel
The View displays the result to the user

The MVC architecture provides a clear and scalable structure for SUMMS. It supports complex user interactions, multiple roles, and real time data processing while maintaining clean separation between components. This ensures that the system can be easily extended and maintained.
