import { PropertymappingsApi, Configuration } from '@goauthentik/api';

// Setup the configuration object with the base path to your Authentik instance
const config = new Configuration({
  basePath: 'http://172.16.2.60:9000/api/v3',  // Make sure to include the full URL, starting with "https://"
  // Optional: Add authorization token or other headers if necessary
  headers: {
    Authorization: 'Bearer AZBFB9vmt6DX7r9lsKQLgbu2WVLZ3QjhLf9n29KY5DFJDwl02EtnI0j7ynh2',  // Replace 'your_api_token' with the actual token
  },
    // headers: {
    //     "X-authentik-CSRF": getCookie("authentik_csrf"),
    // },
});

// Create an instance of Propertymappings using the configuration
const Propertymappings = new PropertymappingsApi(config);
// console.log(Propertymappings)
var res = await Propertymappings.propertymappingsSourceOauthCreate({oAuthSourcePropertyMappingRequest:{
    name:"test",
    expression:"return true"
}})
console.log(res)
const status = await Propertymappings.propertymappingsAllList({
    search:"test"
});  // Call the API method
console.log('System Status:', status);  // Output the status

