# Meta integration

Phase 3 uses Meta's official Instagram API with Instagram Login for professional accounts. The current direct-login flow uses an Instagram user access token and the `instagram_business_basic` permission for account identity. The implementation intentionally does not add publishing, comments, messaging, or insights permissions yet.

Required environment variables are `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, and a randomly generated 32-byte base64url `TOKEN_ENCRYPTION_KEY`. Optional URL overrides are available for local mocking and controlled environments. Register the exact callback URL in the Meta app: `META_REDIRECT_URI`.

The flow is: authenticated OWNER/ADMIN requests an opaque state, the browser visits the official Instagram authorization URL, the callback validates and consumes the state, exchanges the code server-side, exchanges the short-lived token for a long-lived token, fetches `/me` profile data, encrypts the token with AES-256-GCM, and only then persists the account. Tokens never appear in API responses, audit metadata, or application logs.

Meta's current documentation distinguishes Instagram Login from the older Facebook Login/Page flow. This phase uses Instagram Login, so `facebookPageId` remains nullable and is not required for the implemented identity flow. See the [official Meta Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api) for the current access-level and permission requirements; verify the Meta developer dashboard before production review because permissions and access requirements can change.

Phase 4 keeps account/media/insight synchronization behind `InstagramDataProvider`. `MockMetaProvider` is deterministic and local-only; `RealMetaProvider` is the replacement seam for future account/media/insights calls. The current real provider class intentionally throws until its credential adapter is completed, so mock data cannot be mistaken for production Meta data.
