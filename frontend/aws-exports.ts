import { type ResourcesConfig }from "aws-amplify"; 
 export const awsExports: ResourcesConfig = {
  "Auth": {
    "Cognito": {
      "userPoolClientId": "6aqqd584d1r5ubdtvvcmpm7arl",
      "userPoolId": "ap-southeast-2_4BZ8gT9cB",
      "allowGuestAccess": true,
      "identityPoolId": "ap-southeast-2:a0216a40-8298-482e-a33b-46f35784f32f",
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
      "endpoint": "https://hh6ouk27ajbh7kemo4f7jzfk2m.appsync-api.ap-southeast-2.amazonaws.com/graphql",
      "region": "ap-southeast-2",
      "defaultAuthMode": "userPool"
    }
  },
  "Storage": {
    "S3": {
      "bucket": "dfsk-objectstore",
      "region": "ap-southeast-2"
    }
  }
}