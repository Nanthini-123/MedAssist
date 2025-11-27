Operator Widget — SalesIQ integration notes

1. Embedding:
   - Host the built widget (dist folder) on a public URL (Vercel/Netlify).
   - In SalesIQ operator widget settings, add this URL as an iframe for operator.

2. Opening/focusing chat from widget:
   - The widget posts: window.parent.postMessage({ type:'open_chat', email: 'visitor@example.com' }, '*')
   - SalesIQ operator console (or your custom wrapper) must listen to message events and focus/open the chat with that visitor.
   - If SalesIQ does not allow custom script in operator console, use the operator to click the conversation manually. The widget is for context & quick actions only.

3. Operator messages:
   - Operators reply from SalesIQ Conversations panel (not from the widget).
   - Widget provides buttons for "Resend confirmation", "Cancel", etc. which call backend endpoints.

4. Security:
   - Use HTTPS for widget URL and backend API.
   - If needed, allowlist SalesIQ host in CORS and use HMAC to validate incoming messages.