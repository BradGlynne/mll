exports.buildJson = function (origin, destination, isRush, rushTargetDate, volume, collateral, eveCharacterName, discordId, structureType, submittedDate, discordRoleId){
  let rushDate = 'N/A'
  if (isRush && rushTargetDate) {
    rushDate = rushTargetDate.toLocaleString('en-GB', {timeZone: 'UTC'})
  }
  let structureText = "Yes";
  if (!structureType) {
    structureText = "No";
  }
    let jsonData = {
        "username": "MLL Custom Contract Request",
        "avatar_url": "https://multi-lemm-logistics.com/img/logo.png",
        "content": `<@&${discordRoleId}>`,
        "embeds": [
            {
                "author": {
                    "name": "MLL Custom Contract Bot",
                    "url": "http://multi-lemm-logistics.com",
                    "icon_url": "https://multi-lemm-logistics.com/img/logo.png"
                },
                "title": "MLL Custom Contract Notification",
                "url": "http://multi-lemm-logistics.com/contracts",
                "description": `**${eveCharacterName} (${discordId})** has put up a custom contract request, see below for details. Please message the customer via discord and react to this message with a :white_check_mark:`,
                "color": 16757309,
                "fields": [
                    {
                      "name": "Request Date",
                      "value": `${submittedDate.toLocaleString('en-GB', {timeZone: 'UTC'})}`,
                      "inline": true
                    },
                    {
                        "name": "Origin",
                        "value": `${origin}`,
                        "inline": true
                    },
                    {
                        "name": "Destination",
                        "value": `${destination}`,
                        "inline": true
                    },
                    {
                        "name": "PH/NPC Structures",
                        "value": `${structureText}`,
                        "inline": true
                    },
                    {
                        "name": "Volume",
                        "value": `${volume.toLocaleString("en-GB")} m3`,
                        "inline": true
                    },
                    {
                        "name": "Collateral",
                        "value": `${collateral.toLocaleString("en-GB")} ISK`,
                        "inline": true
                    },
                    {
                        "name": "Rush Target Date",
                        "value": `${rushDate}`,
                        "inline": true
                    }
                ]
            }
        ]
    };


    return jsonData;
}
