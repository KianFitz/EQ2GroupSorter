var html2canvas;

const items = document.querySelectorAll("div.group-item");
const containers = document.querySelectorAll("div.group-frame");

let isDirty = false;

let groupSetup = {
    group1: [],
    group2: [],
    group3: [],
    group4: [],
    bench: [],
    unassigned: []
}

items.forEach((item) => {
    item.addEventListener("dragstart", dragStart);
    item.addEventListener("dragend", dragEnd);
    item.addEventListener("drop", drop);
});

containers.forEach((container) => {
  container.addEventListener("dragover", dragOver);
  container.addEventListener("drop", drop);
});

document.getElementById('delete').addEventListener('dragover', dragOver);
document.getElementById('delete').addEventListener('drop', deleteDrop);

document.getElementById('addnew').addEventListener('click', addNew);

function reset() {
    let _continue = true;
    if (isDirty) {
        _continue = confirm ("You have unsaved changes. Are you sure you wish to continue?");
    }

    if (!_continue) {
        return;
    }
    
    groupSetup = {
        group1: [],
        group2: [],
        group3: [],
        group4: [],
        bench: [],
        unassigned: []
    }
    
    containers.forEach((container) => {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    })

    isDirty = false;
}

function getArchetype(value) {
    switch (value) {
        case "Berserker":
        case "Guardian":
        case "Bruiser":
        case "Monk":
        case "Paladin":
        case "Shadowknight":
            return "fighter";
        case "Templar":
        case "Inquisitor":
        case "Fury":
        case "Channeler":
        case "Warden":
        case "Mystic":
        case "Defiler":
            return "priest";
        case "Wizard":
        case "Warlock":
        case "Coercer":
        case "Illusionist":
        case "Conjuror":
        case "Necromancer":
            return "mage";
        case "Swashbuckler":
        case "Brigand":
        case "Dirge": 
        case "Beastlord":
        case "Troubador":
        case "Assassin":
        case "Ranger":
            return "scout";
        default: 
            return "";
    }
}

function addNew() {
    let dropdown = document.getElementById('class');

    let _class = dropdown.options[dropdown.selectedIndex].text;
    let archetype = getArchetype(_class);

    if (archetype == "") {
        alert('Please select a class from the dropdown list.');
        return;
    }

    let charName = document.getElementById('characterName').value;
    if (charName == '') {
        alert('Please add a character name');
        return;
    }

    _add(charName, archetype, _class, document.getElementById('unassigned'));

    dropdown.selectedIndex = 0;
    document.getElementById('characterName').value = '';

    isDirty = true;
}

function _add(charName, archetype, _class, groupFrame) {
    let item = document.createElement('div');
    item.classList.add('group-item',archetype);
    item.appendChild(document.createTextNode(`${charName} - ${_class}`));
    item.draggable = true;
    item.id = charName;
    item.setAttribute('eq2Class', _class);

    groupFrame.appendChild(item);

    item.addEventListener("dragstart", dragStart);
    item.addEventListener("dragend", dragEnd);
    item.addEventListener("drop", drop);
}

function deleteDrop() {
    const draggedImageId = event.dataTransfer.getData("draggedImageId");
    const draggedImage = document.getElementById(draggedImageId);
    const fromContainer = draggedImage.parentNode;

    draggedImage.remove();

    isDirty = true;
}

function saveToFile() {

    groupSetup = {
        group1: [],
        group2: [],
        group3: [],
        group4: [],
        bench: [],
        unassigned: []
    }

    document.querySelectorAll('.group-frame').forEach((group) => {
        const id = group.id;

        [...group.children].forEach((item) => {
            groupSetup[id].push({charName: item.id, eq2Class: item.getAttribute('eq2Class')});
        });
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json,'+JSON.stringify(groupSetup));
    element.setAttribute('download', 'raid_setup.json');
    element.click();

    isDirty = false;
}

function loadFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.click();

    input.onchange = e => {

        reset();
        var file = e.target.files[0];

        var reader = new FileReader();
        reader.readAsText(file, 'UTF-8');

        reader.onload = readerEvent => {
            var content = readerEvent.target.result;
            groupSetup = JSON.parse(content);

            document.querySelectorAll('div.group-frame').forEach((group) => {
                const id = group.id;
        
                if (id != null) {
                    itemsToAdd = groupSetup[id];
            
                    itemsToAdd.forEach((item) => {
                        _add(item.charName, getArchetype(item.eq2Class), item.eq2Class, group);
                    });
                }
            });
        };
    }

    isDirty = false;
}

async function sendImageToDiscordWebhook(imageBlob, webhookURL) {
    // Create a FormData object
    const formData = new FormData();
    // Append the image blob to the FormData object
    formData.append('file', imageBlob, 'image.png');
  
    try {
      // Send a POST request to the Discord webhook URL
      const response = await fetch(webhookURL, {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        // If the response is not OK (status code not in the 200 range), throw an error
        throw new Error(`Failed to send image to Discord webhook: ${response.status} - ${response.statusText}`);
      }
  
      // Log success message
      console.log('Image sent successfully to Discord webhook!');
    } catch (error) {
      // Log and handle any errors that occur during the request
      console.error('Error sending image to Discord webhook:', error.message);
    }
  }
  

function copyToClipboard() {
    html2canvas(document.getElementById("container")).then(canvas => {
        const img = document.createElement("img");
        img.src = canvas.toDataURL();
        img.id = "temp";

        img.addEventListener('load', async () => {
            try {
                const response = await fetch(img.src);
                const blob = await response.blob();

                var webhookUrl = "https://discord.com/api/webhooks/1224748591684391065/lvP1jKahudFGUJFnqIIAEQwo9dfQuPUrsos2hmEIiepezl-pP9CIf8_nmXajtBxawbrp";

                sendImageToDiscordWebhook(blob, webhookUrl);

            }                
            catch (e){
                    console.log(e);
            }
        });
    });
}

function unassignall() {
    document.querySelectorAll('div.group-frame').forEach((group) => {
        const id = group.id;
        const unassigned = document.getElementById("unassigned");

        if (id != null && id != "unassigned") {
            [...group.children].forEach((item) => {
                unassigned.appendChild(item);
            });
        }
    });
}

function unassign() {

}

function dragStart(event) {
  event.dataTransfer.setData("draggedImageId", event.target.id);
  setTimeout(() => event.target.classList.toggle("hidden"));
}

function dragEnd(event) {
  event.target.classList.toggle("hidden");
}

function dragOver(event) {
  event.preventDefault();
}

function drop(event) {
  const draggedImageId = event.dataTransfer.getData("draggedImageId");
  const draggedImage = document.getElementById(draggedImageId);
  const fromContainer = draggedImage.parentNode;
  let toContainer = event.currentTarget;

  let elementToGoBefore = null;

  let swap = null;

  if (toContainer !== fromContainer) {

    if (toContainer.classList.contains("group-item")) {
        swap = toContainer;

        if (toContainer.nextSibling != null) {
            elementToGoBefore = toContainer.nextSibling.nextSibling;
        }
        toContainer = toContainer.parentNode;
    }

    if (draggedImage != null) {
        if (elementToGoBefore != null) {
            toContainer.insertBefore(draggedImage,elementToGoBefore);
        }
        else {
            toContainer.appendChild(draggedImage);
        }
    }

    if (swap != null) {
        fromContainer.appendChild(swap);
    }
  }

  isDirty = true;
}