import { PropertymappingsApi, Configuration } from '@goauthentik/api';

// Setup the configuration object with the base path to your Authentik instance
const config = new Configuration({
  basePath: 'http://localhost:9000/api/v3',
  headers: {
    Authorization: 'Bearer AZBFB9vmt6DX7r9lsKQLgbu2WVLZ3QjhLf9n29KY5DFJDwl02EtnI0j7ynh2',
  },
});



// script for property mappings
const Propertymappings = new PropertymappingsApi(config);

//Scope mappings 
const scopeMappings = [
  {
    name: 'adminName',
    scopeName: 'name',
    expression: `
admin_name = request.user.attributes.get('adminName', None)
if admin_name:
    admin_name = str(admin_name)
else:
    admin_name = 'cboi_admin'
return { "adminName": admin_name }
`.trim(),
    description: 'Admin display name',
  },
  {
    name: 'authorities',
    scopeName: 'authorities',
    expression: `
return {
    "authorities": [group.name for group in request.user.ak_groups.all()]
}
`.trim(),
    description: 'User authorities (groups)',
  },
  {
    name: 'bankCode',
    scopeName: 'bankCode',
    expression: `
return { "bankCode": "cboi" }
`.trim(),
    description: 'Static bank code',
  },
  {
    name: 'created',
    scopeName: 'created',
    expression: `
from django.utils import timezone
now = timezone.now()
return { "created": int(now.timestamp()*1000) }
`.trim(),
    description: 'Creation timestamp (ms)',
  },
  {
    name: 'ifsc',
    scopeName: 'ifsc',
    expression: `
return { "ifsc": request.user.attributes.get("ifsc","") }
`.trim(),
    description: 'IFSC from user attributes',
  },
  {
    name: 'path',
    scopeName: 'path',
    expression: `
if request.user.username == "internal_admin":
    return {"path": "users/MUMBAI/"}
elif request.user.username in ["internal_maker", "internal_checker"]:
    return {"path": "users/MUMBAI/AHMEDABAD/GANDHINAGAR/ADALAJ/"}
elif ak_is_group_member(request.user, name="ROLE_ADMIN"):
    return {"path": request.user.path}
else:
    return {"path": request.user.path + "/"}
`.trim(),
    description: 'Computed user path',
  },
  {
    name: 'privileges',
    scopeName: 'privileges',
    expression: `
path = request.user.path + "/"
privileges = [group.name for group in request.user.ak_groups.all()]
privileges.append(path)
return { "privileges": privileges }
`.trim(),
    description: 'Groups + path as privileges',
  },
  {
    name: 'user_name',
    scopeName: 'user_name',
    expression: `
username = request.user.username
return { "user_name": username }
`.trim(),
    description: 'Username echo',
  },
];

//Webhook mapping
const webhookMapping = {
  name: 'temp-password-set-on-user-creation-webhook-payload',
  expression: `
import random
import string
from datetime import datetime, timedelta

event = notification.event
context = event.context

if event.action != "model_created":
    return None

diff = context.get("diff", {})
attributes = diff.get("attributes", {}).get("new_value", {})
username = diff.get("username", {}).get("new_value")
mobile = attributes.get("mobile_number")

# Only proceed if we have both username and mobile
if not username or not mobile:
    return None

temporary_password = "cboi@2025"

ak_call_policy('set-temp-password-on-user-creation', temp_password=temporary_password,
    user_pk=context.get("model", {}).get("pk"))

return {
    "user_name": username,
    "feature": "FORGETPASSWORD",
    "operation_performed": "PASSWORD_TEMPORARY",
    "status": "SUCCESS",
    "status_code": "0",
    "notification_data": {
        "mobile_number": mobile,
        "WhatsappMobile": "",
        "params": {
            "column4": username,
            "column48": temporary_password
        }
    }
}
`.trim(),
};

for(const mp of scopeMappings){
  try {
    await Propertymappings.propertymappingsProviderScopeCreate({
      scopeMappingRequest: {
        name: mp.name,
        scopeName: mp.scopeName,
        expression: mp.expression,
      },
    });
    console.log('Created scope mapping:', mp.name);
  } catch (e) {
    if (e?.response) {
      const txt = await e.response.text();
      console.error('Failed:', mp.name, 'status=', e.response.status, 'body=', txt);
    } else {
      console.error('Failed:', mp.name, e);
    }
  }
}


await Propertymappings.propertymappingsNotificationCreate({
  notificationWebhookMappingRequest: {
    name: webhookMapping.name,
    expression: webhookMapping.expression,
  },
});
console.log('Created Webhook Mapping:', webhookMapping.name);

console.log('✅ All mappings created');


