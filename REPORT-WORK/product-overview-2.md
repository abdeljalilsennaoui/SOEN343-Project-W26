# Product Overview

## React
Link: https://react.dev/
React was used for the frontend because it supports reusable UI components, state based rendering, and a responsive user experience. It was a good fit for our project because the system contains several interactive screens, such as booking pages, several different dashboards, maps, and analytics related views. React also works with JavaScript, which keeps it consistent across the frontend and backend.
Alternatives such as Angular and Vue were considered. Angular provides a more complete framework, but it introduces more complexity for the project. Vue is simpler and also effective for UI development, but React was chosen because of its strong flexibility and familiarity within the team.

## Vite 
Link: https://vite.dev/

Vite was used as the frontend build tool because it offers fast development startup and a lightweight configuration process. This made frontend development more efficient, especially when working on multiple UI components and pages that required frequent updates and testing. 

An alternative would have been Create React App or a Webpack setup. However, Create React App is slower and less modern, while Webpack requires 
more manual configuration. Vite was selected because it is simpler, faster, and better suited for React development.

## Node.js
Link: https://nodejs.org/en
Node.js was used as the backend runtime because it supports asynchronous programming and allows the use of JavaScript on both the frontend and backend. This simplifies development and enables efficient handling of requests such as booking operations and API communication.
Alternatives such as Python with Django or Java with Spring Boot were considered. However, these options require a different technology stack and a more complex setup process. Node.js was chosen because it integrates well with the rest of the project and is well-suited for building web applications.

## Express.js
Link: https://expressjs.com/
Express.js was used as the backend framework because it provides a simple and flexible way to define routes, middleware, and API endpoints. It made it easier to organize the backend around controllers, services, and request handling while keeping the implementation lightweight and readable.
Alternatives such as NestJS or Koa were considered. NestJS provides a more structured architecture, but it adds additional complexity. Koa is lightweight, but Express has better documentation and simpler integration. For these reasons, Express.js was chosen.

## Google Firestore
Link: https://firebase.google.com/docs/firestore
Google Firestore was used as the database because it offers cloud-based storage, flexible document structures, and real-time data synchronization. It was suitable for storing users, vehicles, bookings, parking information, and analytics-related data without requiring a complex design. Its integration with Firebase services also simplified setup and development.
Alternatives such as MySQL, PostgreSQL, and MongoDB were considered. Relational databases provide strong structure and relationships, but they require more setup and schema management. MongoDB was also a possible NoSQL alternative, but Firestore was chosen because it integrates directly with Firebase Authentication and supports a simpler workflow for this project.

## Firebase Authentication
Link: https://firebase.google.com/docs/auth
Firebase Authentication was used to manage user login and access control through email/password authentication and Google OAuth. It simplified the implementation of secure sign-in flows and reduced the need to manually handle passwords and sessions.
An alternative would have been to implement custom authentication with JWT and Express, or use Auth0. A custom solution would require more development time and introduce more security responsibility. Firebase Authentication was chosen because it integrates well with Firestore and is easier to configure.

## Google Maps JavaScript API
Link: https://developers.google.com/maps/documentation/javascript/overview
The Google Maps JavaScript API was used to support map-based features such as displaying markers, routing, geocoding, and place search. Since the project is focused on mobility, map functionality is essential for visualizing vehicle locations, parking spots, and user navigation. 
Alternatives such as Leaflet with OpenStreetMap or Mapbox were considered. Leaflet is lightweight and flexible, but additional plugins would be needed for advanced routing and place-based services. Mapbox is also strong for interactive maps, but Google Maps was chosen because of its built-in geocoding, Places API support, and familiarity among the team.

## Jest
Link: https://jestjs.io/
Jest was used for testing because it provides a simple and effective framework for writing unit tests and validating backend and frontend logic. It supports assertions, mocking, and automated test execution, which helped verify the correctness of key components in the system.
Alternatives such as Mocha and Jasmine were possible. However, Jest was selected because it requires less setup, includes built-in mocking features, and is widely used in JavaScript projects. This made it a practical choice for fast and consistent test development.

## Supertest
Link: https://www.npmjs.com/package/supertest
Supertest was used together with Jest to test backend API endpoints. It allows HTTP requests to be simulated directly against the Express application, making it suitable for validating routes, request handling, and response behaviour in integration tests.
An alternative would have been Postman-only testing or Chai HTTP. However, Postman is better for manual testing than automated validation, and Chai HTTP would require a different testing setup. Supertest was chosen because it integrates naturally with Jest and is widely used for Express API testing.

## GitHub Actions
Link: https://github.com/features/actions
GitHub Actions was used for continuous integration so that tests and checks could run automatically whenever code was pushed or updated. This helped the team detect issues earlier, maintain code quality, and ensure that contributions from multiple members could be validated consistently.
Alternatives such as Jenkins, CircleCI, and Travis CI were considered. These tools are also suitable for CI, but they require more setup or external configuration. GitHub Actions was chosen because it is built directly into GitHub, easy to configure, and convenient for our team since we were already using GitHub for version control and collaboration.
