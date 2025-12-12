import type { CorsOptions } from "cors";
import { corsOrigin } from "../services/constant.js";

// export const corsOptions: CorsOptions = {
//   origin: (origin, callback): void => {
//     if (origin === undefined || corsOrigin.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
// };

export const corsOptions: CorsOptions = {
  origin: (origin, callback): void => {
    // ✅ Allow requests with no Origin (like Postman or local HTML files)
    if (!origin || corsOrigin.includes(origin) || origin === "null") {
      callback(null, true);
    } else {
      console.error("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// export const corsOptions = {
//   origin: '*', // Explicitly allow all origins
// };
