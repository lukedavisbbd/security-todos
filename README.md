# security-todos

# Development

Backend: `cd backend`, then run `npm run dev`

Frontend: `cd frontend`, then run `npm run dev`

Both the back-end and front-end must be running, back-end will run on port 3000, front-end will run on port 5173. Requests to the `/api/...` routes on the front-end will map to the back-end. So `fetch` calls should use relative urls. (This is so we don't have to worry about CORS.) The back-end requires a `.env` file to be present in the `backend` directory.
