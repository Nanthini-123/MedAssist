import Hubspot from "@hubspot/api-client";

const hubspot = new Hubspot.Client({ accessToken: process.env.HUBSPOT_API_KEY });

export async function addToHubspot(name, phone, reason) {
  await hubspot.crm.contacts.basicApi.create({
    properties: {
      firstname: name,
      phone,
      recent_reason: reason
    }
  });
}