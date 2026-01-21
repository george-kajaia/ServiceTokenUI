export const environment = {
  // Base URL for Company/Investor/Product/Request/User controllers
  apiBaseUrl: 'https://ec2-3-66-156-73.eu-central-1.compute.amazonaws.com/servicetoken/api',

  // NOTE: In the provided ServiceTokenAPI project, ServiceTokenController uses [Route("api/[controller]")]
  // (not "servicetoken/api"). That makes its endpoint root different.
  // If you later unify routes on the backend, you can set this to the same value as apiBaseUrl.
  serviceTokenApiBaseUrl: 'https://ec2-3-66-156-73.eu-central-1.compute.amazonaws.com/api'
};
