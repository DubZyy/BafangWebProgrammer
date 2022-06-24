function setSlideValue(p1) {
    document.getElementById(p1.getAttribute("id") + "_value").value = p1.value;
}

/***********************************
Bafang Web Config

Copyright (c) 2021 Jonatan Liljedahl
************************************/

const bafang = new BafangConfig();
const connectButton = document.getElementById('connect-to-serial');
const disconnectButton = document.getElementById('disconnect-serial');
const serialMessagesContainer = document.getElementById('serial-messages-container');
const readAllButton = document.getElementById('read-all');
const writeAllButton = document.getElementById('write-all');
// const readGenButton = document.getElementById('read-gen');
const readBasButton = document.getElementById('read-bas');
const readPasButton = document.getElementById('read-pas');
const readThrButton = document.getElementById('read-thr');
const writeBasButton = document.getElementById('write-bas');
const writePasButton = document.getElementById('write-pas');
const writeThrButton = document.getElementById('write-thr');
const filePicker = document.getElementById('file-pick');
const saveFileButton = document.getElementById('save-file');

function updateTextInput(val) {
    document.getElementsByClassName('rangeVal').value = val;
}

window.onload = () => {

    let t = document.querySelector("table#basic");
    /*
                for (let i = 0; i < 10; i++) {
                    let row = t.insertRow();
                    let th = document.createElement("th");
                    th.innerText = i;
                    row.appendChild(th);
                    let cell1 = row.insertCell();
                    let num1 = document.createElement("input");
                    let numVal = document.createElement("input");
                    cell1.appendChild(num1);
                    cell1.appendChild(numVal);
                    let cell2 = row.insertCell();
                    let num2 = document.createElement("input");
                    let divnum2 = document.createElement("div");
                    divnum2.setAttribute("class", "range");
                    cell2.appendChild(divnum2);
                    divnum2.appendChild(num2);
                    num1.id = "assist" + i + "_current";
                    num2.id = "assist" + i + "_speed";
                    for (let e of [num1, num2]) {
                        e.setAttribute("type", "range");
                        //e.setAttribute("data-min", 0);
                        //e.setAttribute("onchange", "updateTextInput(this.value);");
                        e.setAttribute("class", "form-range")
                        //e.setAttribute("data-max", 100);
                        //e.setAttribute("data-value", 50);
                        // e.classList.add("cfg");
                        e.addEventListener('change', () => {
                            updateChart();
                        });
                    }
    
                    bafang.onSerialConnect(false);
                }
    */
    const sections = ["basic", "pedal", "throttle"];
    for (let s of sections) {
        let t = document.querySelector("table#" + s);
        for (let r of t.rows) {
            let last = r.cells[r.cells.length - 1];
            if (last.tagName == "TD") {
                let cell = r.insertCell();
                cell.style.border = 0;
                cell.style.background = 0;
                cell.classList.add("reload-cell");
                let b = document.createElement("button");
                b.innerHTML = "&#x21bb;"
                cell.appendChild(b);
                let configs = r.querySelectorAll(".cfg");
                b.setAttribute("title", "Reset to last read value"); // TODO: could update tooltip with old value in onRead()
                b.addEventListener('click', () => {
                    for (let e of configs) {
                        if (bafang.data[s])
                            updateCfgField(e, bafang.data[s][e.id]);
                    }
                });
            }
        }
    }

    const a = document.querySelectorAll("select#designated_assist");
    for (let sel of a) {
        for (let i = 0; i < 10; i++) {
            let opt = document.createElement("option");
            opt.innerText = "Assist " + i;
            opt.value = i;
            sel.appendChild(opt);
        }
        let opt = document.createElement("option");
        opt.innerText = "Display";
        // opt.innerText = "Set by display";
        // opt.value = "Display";
        sel.appendChild(opt);
    }

    //slow_start_mode current_decay
    for (let id of ["slow_start_mode", "current_decay"]) {
        const sel = document.querySelector("select#" + id);
        for (let i = 1; i < 9; i++) {
            let opt = document.createElement("option");
            opt.innerText = i;
            sel.appendChild(opt);
        }
    }

    if (window.File && window.FileReader) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
    updateChart();
};

bafang.parseTable = (blk) => {
    const name = blockKeys[blk];
    console.log("Parsing table", name);
    let info = {};
    bafang.data[name] = info;
    clearErrorHL();
    const nodes = document.querySelectorAll("table#" + name + " .cfg");
    for (let e of nodes) {
        const val = e.tagName == "TD" ? e.innerText : e.value;
        if (!val) {
            bafang.logError(blk, "Missing value");
            errorHL(blk, e.id);
            return false;
        }
        const num = parseInt(val);
        if (num == val) {
            if (num > 255 || num < 0) {
                bafang.logError(blk, "Value out range");
                errorHL(blk, e.id);
                return false;
            }
            info[e.id] = num;
        } else {
            info[e.id] = val;
        }
    }
    bafang.logMsg(blk, "");
    return true;
};

function updateCfgField(e, val) {
    if (e) {
        if (e.tagName == "TD")
            e.innerText = val;
        else
            e.value = val;
    }
}

function updateTable(name, info) {
    console.log("Updating table", name);
    if (!info) info = bafang.data[name];
    const infoTable = document.querySelector("table#" + name);
    for (key in info) {
        const e = infoTable.querySelector("#" + key);
        updateCfgField(e, info[key]);
    }
}

function clearErrorHL() {
    let a = document.querySelectorAll(".highlight-error");
    for (e of a)
        e.classList.remove("highlight-error");
}

function errorHL(blk, key) {
    blk = blockKeys[blk];
    console.log("Error at", blk, key);
    let e = document.querySelector("table#" + blk + " #" + key);
    while (e.tagName != "TD") e = e.parentNode;
    e.classList.add("highlight-error");
}

bafang.onWrite = (blk, key) => {
    clearErrorHL();
    if (!!key) {
        // window.scrollTo({top:0, behaviour: 'smooth'});
        errorHL(blk, key);
    }
};

bafang.onRead = (blk) => {
    clearErrorHL();
    if (blk == BLK_GEN) { // Connected to controller
        for (let b of document.querySelectorAll("button.read, button.write")) {
            b.removeAttribute('disabled');
        }
    }
    if (blk) {
        updateTable(blockKeys[blk]);
        updateChart();
    }
};

bafang.onSerialConnect = (state) => {
    let st = document.querySelector("#port-status");
    if (state) {
        // readGenButton.removeAttribute('disabled');
        st.innerText = "Connected";
        st.style.background = "#20bf20";
        connectButton.setAttribute('disabled', 1);
        disconnectButton.removeAttribute('disabled');
    } else {
        // readGenButton.setAttribute('disabled',1);
        st.innerText = "Not Connected";
        st.style.background = "#f55";
        disconnectButton.setAttribute('disabled', 1);
        connectButton.removeAttribute('disabled');
        for (let e of document.querySelectorAll("button.read, button.write")) {
            e.setAttribute('disabled', 1);
        }
    }
};

connectButton.addEventListener('click', () => {
    bafang.init();
});
disconnectButton.addEventListener('click', () => {
    bafang.close();
});

// readGenButton.addEventListener('click', () => {
//   bafang.connectDevice();
// });

readAllButton.addEventListener('click', () => {
    bafang.readAllBlocks();
});
writeAllButton.addEventListener('click', () => {
    bafang.writeAllBlocks();
});

readBasButton.addEventListener('click', () => {
    bafang.readBlock(BLK_BAS);
});
readPasButton.addEventListener('click', () => {
    bafang.readBlock(BLK_PAS);
});
readThrButton.addEventListener('click', () => {
    bafang.readBlock(BLK_THR);
});

writeBasButton.addEventListener('click', () => {
    bafang.writeBlock(BLK_BAS);
});
writePasButton.addEventListener('click', () => {
    bafang.writeBlock(BLK_PAS);
});
writeThrButton.addEventListener('click', () => {
    bafang.writeBlock(BLK_THR);
});

filePicker.addEventListener('change', (evt) => {
    bafang.readFile(evt.target.files[0]);
});

saveFileButton.addEventListener('click', () => {
    bafang.saveFile();
});


const canvas = document.getElementById('chart_current');
function updateChart() {
    /* TODO:
    update when any relevant field changes
    */
    if (!canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    const h = canvas.height;
    const w = canvas.width;
    ctx.clearRect(0, 0, w, h);
    const xofs = 40;
    const marg = 15;
    const barDx = Math.floor((w - xofs * 2) / 10);
    const barWidth = Math.floor(barDx * 0.75);
    ctx.strokeStyle = '#ccc';
    ctx.font = "14px monospace";
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'middle';
    let dy = (h - marg * 2) / 4;
    let amps = parseInt(document.getElementById("current_limit").value) || 0;
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    for (let i = 0; i < 5; i++) {
        let y = Math.floor(marg + dy * i) + 0.5;
        let v = 1 - (i / 4);
        ctx.moveTo(xofs, y);
        ctx.lineTo(w - xofs, y);
        ctx.textAlign = 'end';
        ctx.fillText(v * 100 + '%', xofs - 5, y);
        ctx.textAlign = 'start';
        ctx.fillText(Math.round(v * amps) + 'A', w - xofs + 5, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    let xofs2 = xofs + Math.floor((barDx - barWidth) / 2);
    let keep = (parseInt(document.getElementById("keep_current").value) || 0) / 100.0;
    for (let x = 0; x < 10; x++) {
        let e = document.getElementById("assist" + x + "_current");
        let v = (parseInt(e.value) || 0) / 100.0;
        // let dy = Math.max(1,(h-marg*2)*v);
        let dy = (h - marg * 2) * v;
        let xx = x * barDx + xofs2;
        ctx.fillStyle = '#888';
        ctx.fillRect(xx, h - dy - marg, barWidth, dy + 1);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(xx, h - dy * keep - marg, barWidth, dy * keep + 1);
        ctx.fillStyle = 'black';
        ctx.fillText(x, xx + barWidth / 2, h - marg + 2);
    }
}

window.addEventListener('resize', () => {
    canvas.width = canvas.parentNode.clientWidth;
    updateChart();
});

for (let id of ["current_limit", "keep_current"]) {
    document.getElementById(id).addEventListener('change', updateChart);
}


// navigator.serial.addEventListener("connect", (event) => {
// TODO: Automatically open event.target or warn user a port is available.
//   console.log("Connected "+event.target);
// });

// navigator.serial.addEventListener("disconnect", (event) => {
//   // TODO: Remove |event.target| from the UI.
//   // If the serial port was opened, a stream error would be observed as well.
//   console.log("Disconnected "+event.target);
// });
