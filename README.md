# Job Search Sketchbook

Build an app Build the mobile web app described in the attached PRD. Use the attached hand-drawn sketch as the visual design: match its layout, screen names and hand-drawn sketchbook style (cream grid background, black ink outlines, money green, red, gold stars, handwritten font for screen titles).



Security first, before any screens:

- Row Level Security on every table; users can only read and write their own rows

- every AI call and secret stays in backend functions, never in the browser

- check on the server that the user owns whatever they request



Build in this order, finishing each part before starting the next:

1. Welcome, Info and CV screen (6-step questionnaire plus the small "Skip: upload my CV instead" option using built-in AI task 1). Under 18 cannot continue.

2. Top Match, Job Offers, Soulmates and the bottom tab bar. Add about 10 sample listings with made-up company names, marked as sample data. Use AI task 2 for each job's fit score and one-line reason; sort by score. Swipe right or heart saves to Soulmates, swipe left dismisses. Accept moves the job to Tracker as "applied"; Decline dismisses.

3. Tracker: jobs by stage, tap to change stage; "rejected" opens the rejection form; the Rejection summary uses AI task 6 (patterns only, no advice).

4. Verify and Review Page. "Write a review" sends unverified users to Verify first. Use AI task 3 for the ID photo check; the app, not the AI, decides pass or fail from the returned fields. A random object, screenshot or blank card must fail with a clear reason. Label it "Prototype check: a certified KYC provider replaces this at launch". Reviews stay hidden until approved and show only "Verified reviewer · [contract type] · [year]". Sample reviews only on the made-up companies.



When done, audit the app against every item in the PRD's Security and Legal requirements, fix every failure, and flag any risk you can't fix instead of working around it.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c341fbbb-63ac-462d-a781-4531870bcc2f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
