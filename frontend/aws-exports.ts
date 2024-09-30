import { type ResourcesConfig }from "aws-amplify"; 
 export const awsExports: ResourcesConfig = {
  "Auth": {
    "Cognito": {
      "userPoolClientId": "2f33j2gb31numfdk0sq9f5e5a5",
      "userPoolId": "ap-southeast-2_OdijNgMUU",
      "allowGuestAccess": true,
      "identityPoolId": "ap-southeast-2:af1c2077-4caa-43c8-9ea7-838545ba5737",
      "signUpVerificationMethod": "code",
      "loginWith": {
        "email": true,
        "oauth": {
          "domain": "d.auth.ap-southeast-2.amazoncognito.com",
          "providers": [
            "Google"
          ],
          "scopes": [
            "phone",
            "email",
            "profile",
            "openid"
          ],
          "redirectSignIn": [
            "http://localhost:3000/",
            "https://testing.com/",
            "https://dev.com/"
          ],
          "redirectSignOut": [
            "http://localhost:3000/",
            "https://testing.com/",
            "https://dev.com/"
          ],
          "responseType": "code"
        }
      }
    }
  },
  "API": {
    "GraphQL": {
      "endpoint": "https://tdvylhhiwrdnvhffchz2pi6ixu.appsync-api.ap-southeast-2.amazonaws.com/graphql",
      "region": "ap-southeast-2",
      "defaultAuthMode": "userPool"
    }
  }
}