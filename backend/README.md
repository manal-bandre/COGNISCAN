# Cogniscan Backend

Express + TypeScript API backed by MongoDB (Mongoose).

## Requirements

- Node.js 20+ (tested with Node 22)
- MongoDB running locally or reachable via connection string

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` (copy from `.env.example`) and fill values:

```bash
cp .env.example .env
```

3. (Optional) Seed a demo doctor account:

```bash
npm run seed
```

4. Run the API:

```bash
npm run dev
```

API will start on `http://localhost:8080` by default.

## Notes

- **Patient login** uses OTP. In development, the OTP is returned as `devOtp` from `/api/auth/request-otp`.
- **Caretaker account** is created during patient registration. In development, the caretaker password is returned in the register response under `caretakerLogin`.
- Reports PDF endpoint: `GET /api/reports/:id/pdf`

