# Accessible Student Planner

A web app that helps students plan and track their assignments, built with accessibility at its core. It works in any modern browser on Mac, Windows, Android, and iPhone.

This project is part of my Honors Contract at Youngstown State University. It explores how accessibility and AI assistance can make academic planning easier, while keeping the user in control of every decision.

## Features

### Planning
- Add, edit, and delete assignments with a title, course, due date, and priority
- Mark assignments as done
- Sort by due date, priority, or course
- Filter by course and status (to do, due today, overdue, done)
- Summary boxes show what is to do, due today, overdue, and done. Click one to jump straight to those assignments
- "Overdue" and "Due today" labels
- Assignments due more than 7 days ago move into a collapsible "Older" section
- Date checks catch typos, such as a year typed wrong
- Trash with Undo: deleted assignments can be restored for 7 days before they are removed for good
- Everything saves automatically in the browser

### Accessibility
- Adjustable text size (Normal, Large, Extra large)
- Color themes: Light, Dark, and High contrast. The app follows the computer's own setting the first time it opens
- Full keyboard support with a visible focus outline
- Optional keyboard shortcuts (Option/Alt + N, L, A) that can be turned off
- "Skip to main content" link
- Screen reader support: labeled form fields, real headings and lists, announced error messages and status updates
- Status is shown with words, not color alone
- Settings are saved automatically
- Designed to follow WCAG 2.2 Level AA

### AI assistance (in progress)
- Natural language entry: type something like "Stats homework due Friday, high priority" and the app fills in the details
- Subtask suggestions: break a large assignment into smaller steps
- The user reviews, edits, and confirms every AI suggestion before anything is saved

## Tech stack
- **Frontend:** React, JavaScript, CSS, built with Vite
- **Backend (in progress):** Java with Spring Boot, connecting to the Claude API for the AI features
- **Planned:** PostgreSQL database
- **Tools:** Git, GitHub, ESLint

## Getting started

You need [Node.js](https://nodejs.org) installed.

```bash
git clone https://github.com/Khem-BK/student-planner.git
cd student-planner
npm install
npm run dev
```

Then open the link shown in the terminal (usually http://localhost:5173).

## Project structure

```
src/
  App.jsx                 Main component that holds the data
  components/             Pieces of the interface (form, cards, filters, trash, settings)
  utils/                  Helpers for dates, assignments, and saved settings
  App.css, index.css      Styling and color themes
```

## Roadmap
- [x] Core planner (add, edit, delete, complete, sort, filter)
- [x] Trash with undo
- [x] Accessibility settings panel
- [x] Light, dark, and high contrast themes
- [ ] Spring Boot backend
- [ ] AI natural language entry with a review screen
- [ ] AI subtask suggestions with a review screen
- [ ] Accessibility testing (axe, Lighthouse, VoiceOver, keyboard only)
- [ ] Deploy online
- [ ] PostgreSQL database for syncing across devices

## Author

**Khem Bahadur B K**
Computer Science student, Youngstown State University
