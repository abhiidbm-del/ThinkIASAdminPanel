# ThinkCivil Admin Portal

The administration Angular application for ThinkCivil IAS Academy. It gives authorized staff a protected workspace for managing students, examinations, programs, learning content, payments, communication, and operational features.

## Features

- Admin authentication, dashboard, and role-based route protection
- Student profiles, student list management, exam monitoring, and results
- Program, plan, batch, syllabus, tag, question, study module, and test management
- Prelims and mains test series, live tests, demo tests, quizzes, and answer-writing administration
- Announcements, notifications, testimonials, support features, careers, and free resources
- Directory, meetings, mentorship, coupons, and live-content management
- Angular Material forms and tables with PDF, chart, and rich-content integrations

## Technology

- Angular 19 and TypeScript 5.7
- Angular Router, HTTP client, Reactive Forms, and Angular Material
- CKEditor 5 for rich content editing
- RxJS, Chart.js, Moment, Font Awesome, and PDF support
- Karma and Jasmine for unit tests

## Requirements and installation

- Node.js compatible with Angular 19
- npm
- A running ThinkCivil backend API

From this directory:

```bash
npm install
```

Configure the API URL and other client settings in `src/environment/`. Keep credentials and private service configuration out of source control.

## Development

```bash
npm start
```

Open `http://localhost:4200/`. The application redirects the root route to the login page. Use an account with the required admin role to access protected features.

## Build and test

```bash
npm run build
npm test
```

The production build is written to `dist/thinkcivil-admin/`. Use `npm run watch` for a continuous development build.

## Project structure

```text
src/app/
	core/       Guards, interceptors, models, and shared services
	modules/    Admin, auth, dashboard, tests, results, and content features
	shared/     Reusable components, pipes, translations, and services
```

Routes are defined in `src/app/app.routes.ts`. Administrative routes use both `authGuard` and `roleGuard` with `role: 'admin'` route data.

## Related applications

- `../student-portal`: Student-facing Angular application
- `../bytestech.online`: Express and MongoDB backend API

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the development server |
| `npm run build` | Create a production build |
| `npm run watch` | Build continuously in development mode |
| `npm test` | Run unit tests |
| `npm run ng -- generate component name` | Generate an Angular component |

For Angular CLI documentation, see the [Angular CLI guide](https://angular.dev/tools/cli).
