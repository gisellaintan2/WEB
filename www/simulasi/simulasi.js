/* ═══════════════════════════════════════
   SIMULASI SCRIPT (Physics & UI Engine)
═══════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
    // --- UI ELEMENTS ---
    const workspace = document.getElementById("workspace");
    const wiringLayer = document.getElementById("wiringLayer");
    const activeWire = document.getElementById("activeWire");
    const modeSwitch = document.getElementById("modeSwitch");
    const btnRotate = document.getElementById("btn-rotate");
    const btnDelete = document.getElementById("btn-delete");
    const btnClear = document.getElementById("btn-clear");
    const paletteItems = document.querySelectorAll(".palette-item");
  
    // --- DIALOG MODAL ELEMENTS ---
    const propModal = document.getElementById("propModal");
    const propTitle = document.getElementById("propTitle");
    const propLabel = document.getElementById("propLabel");
    const propInput = document.getElementById("propInput");
    const propTolWrapper = document.getElementById("propTolWrapper");
    const propTolSelect = document.getElementById("propTolSelect");
    const btnPropCancel = document.getElementById("btnPropCancel");
    const btnPropSave = document.getElementById("btnPropSave");
    const toastOverload = document.getElementById("toast-overload");
    const btnFixCircuit = document.getElementById("btn-fix-circuit");

    let isCircuitBroken = false;
    let draggingWire = null;

    btnFixCircuit.addEventListener("click", () => {
        isCircuitBroken = false;
        toastOverload.classList.remove("show");
        wires.forEach(w => w.el.remove());
        Object.values(components).forEach(c => {
            c.pins[1].connections = [];
            c.pins[2].connections = [];
            c.el.classList.remove("shorted", "powered");
            const smoke = c.el.querySelector(".smoke-fx");
            if(smoke) smoke.remove();
        });
        wires = [];
        simulateCircuit();
    });

    let editingCompId = null;

    // --- CONSTANTS ---
    const COLOR_CODES = {
        0: "#111",      // Hitam
        1: "#8b4513",   // Coklat
        2: "#cc0000",   // Merah
        3: "#ff8c00",   // Oranye
        4: "#ffd700",   // Kuning
        5: "#228b22",   // Hijau
        6: "#0000cd",   // Biru
        7: "#8a2be2",   // Ungu
        8: "#808080",   // Abu-abu
        9: "#f0f8ff"    // Putih
    };
  
    const TOL_CODE_MAP = {
        "1": "#8b4513",
        "2": "#cc0000",
        "0.5": "#228b22",
        "0.25": "#0000cd",
        "0.1": "#8a2be2",
        "0.05": "#808080",
        "5": "#d4af37",
        "10": "#bdc3c7"
    };

    // --- STATE MANAGER ---
    let components = {}; 
    let wires = [];
    let compIdCounter = 0;
    
    let floatingTools = {};
    let floatIdCounter = 0;
    
    let isDrawingWire = false;
    let startPin = null; 
  
    let selectedItem = null; 
  
    // Toggle Mode
    modeSwitch.addEventListener("change", (e) => {
      if (e.target.checked) {
        document.body.classList.remove("mode-real");
        document.body.classList.add("mode-schematic");
      } else {
        document.body.classList.remove("mode-schematic");
        document.body.classList.add("mode-real");
      }
    });

    // Modal Interaction
    btnPropCancel.addEventListener("click", () => {
        propModal.classList.remove("show");
    });


    btnPropSave.addEventListener("click", () => {
        if(editingCompId && components[editingCompId]) {
            let val = parseInt(propInput.value) || 10;
            components[editingCompId].value = Math.max(1, val);
            
            if(components[editingCompId].type === 'resistor') {
               components[editingCompId].tolerance = parseFloat(propTolSelect.value) || 5;
               updateResistorBands(editingCompId);
            } else if(components[editingCompId].type === 'battery') {
               components[editingCompId].el.querySelector('.val-label').textContent = `${components[editingCompId].value}V`;
            }
            simulateCircuit();
        }
        propModal.classList.remove("show");
    });

    function updateResistorBands(cId) {
        const c = components[cId];
        if(c.type !== 'resistor') return;
        let valStr = String(c.value || 10);
        if(valStr.length === 1) valStr = valStr + "0"; 
        
        let d1 = parseInt(valStr[0]);
        let d2 = parseInt(valStr[1]);
        let multiplier = valStr.length - 2;
        if(multiplier < 0) multiplier = 0;
        if(multiplier > 9) multiplier = 9;
   
        const el = c.el;
        if(el.querySelector('.b1')) el.querySelector('.b1').setAttribute('fill', COLOR_CODES[d1] || "#111");
        if(el.querySelector('.b2')) el.querySelector('.b2').setAttribute('fill', COLOR_CODES[d2] || "#111");
        if(el.querySelector('.b3')) el.querySelector('.b3').setAttribute('fill', COLOR_CODES[multiplier] || "#111");
        if(el.querySelector('.b4')) el.querySelector('.b4').setAttribute('fill', TOL_CODE_MAP[String(c.tolerance)] || "#d4af37");
        if(el.querySelector('.val-label')) el.querySelector('.val-label').textContent = `${c.value}Ω`;
    }
  
    // --- DRAG FROM PALETTE ---
    paletteItems.forEach(item => {
      item.addEventListener("dragstart", e => {
        e.dataTransfer.setData("compType", item.dataset.type);
      });
    });
  
    workspace.addEventListener("dragover", e => e.preventDefault());
    workspace.addEventListener("drop", e => {
      e.preventDefault();
      const type = e.dataTransfer.getData("compType");
      if (type) {
        const rect = workspace.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        createComponent(type, x, y);
      }
    });
  
    // --- COMPONENT FACTORY ---
    function createComponent(type, x, y) {
      if (type === 'ammeter' || type === 'voltmeter') {
          createFloatingTool(type, x, y);
          return;
      }
      compIdCounter++;
      const cId = `c${compIdCounter}`;
      
      const tmpl = document.getElementById(`tmpl-${type}`);
      if (!tmpl) return;
      
      const clone = tmpl.content.cloneNode(true);
      const box = clone.querySelector('.comp-box');
      box.id = cId;
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      
      let defVal = 0;
      if (type === 'resistor') defVal = 10;
      if (type === 'battery') defVal = 12;

      components[cId] = {
        id: cId,
        type: type,
        x: x, y: y,
        rotation: 0,
        el: box,
        state: 'off',
        value: defVal,
        tolerance: 5,
        pins: {
          1: { id: 1, connections: [] },
          2: { id: 2, connections: [] }
        }
      };
      
      if(type === 'switch') components[cId].state = 'open';
      
      workspace.appendChild(box);
      setupComponentInteraction(box, cId, type);
      simulateCircuit();
    }
  
    // --- COMPONENT INTERACTION ---
    function setupComponentInteraction(box, cId, type) {
      box.addEventListener("mousedown", e => {
        if (e.target.classList.contains("pin")) return; 
        e.preventDefault(); 
        e.stopPropagation();
        selectItem('comp', cId);
        
        if (type === 'switch') {
          let c = components[cId];
          c.state = c.state === 'open' ? 'closed' : 'open';
          if(c.state === 'closed') {
             box.classList.add("closed");
          } else {
             box.classList.remove("closed");
          }
          simulateCircuit();
        }
        
        let startX = e.clientX;
        let startY = e.clientY;
        let initLeft = parseFloat(box.style.left);
        let initTop = parseFloat(box.style.top);
  
        function onMouseMove(ev) {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          components[cId].x = initLeft + dx;
          components[cId].y = initTop + dy;
          box.style.left = `${components[cId].x}px`;
          box.style.top = `${components[cId].y}px`;
          updateWiresConnectedTo(cId);
        }
  
        function onMouseUp() {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        }
  
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });

      // Selection override (prevent default so draggable works)
      box.addEventListener("dragstart", e => e.preventDefault());
      box.addEventListener("dblclick", e => {
         e.stopPropagation();
         if(type === 'resistor' || type === 'battery') {
            editingCompId = cId;
            let val = components[cId].value;
            
            propTitle.textContent = type === 'resistor' ? 'Konfigurasi Resistor' : 'Konfigurasi Baterai';
            propLabel.textContent = type === 'resistor' ? 'Nilai Hambatan (Ohm):' : 'Beda Potensial (Volt):';
            propInput.value = val;
            
            if (type === 'resistor') {
                propTolWrapper.style.display = "block";
                propTolSelect.value = components[cId].tolerance || 5;
            } else {
                propTolWrapper.style.display = "none";
            }
            
            propModal.classList.add("show");
            setTimeout(() => propInput.focus(), 100);
         }
      });
  
      // Pins Interaction
      const pins = box.querySelectorAll(".pin");
      pins.forEach(pin => {
        pin.addEventListener("mousedown", e => {
          e.preventDefault(); 
          e.stopPropagation();
          const pid = pin.dataset.pid;
          const rect = pin.getBoundingClientRect();
          const wsRect = workspace.getBoundingClientRect();
          const cx = rect.left - wsRect.left + rect.width/2;
          const cy = rect.top - wsRect.top + rect.height/2;
          
          isDrawingWire = true;
          startPin = { compId: cId, pinId: pid, x: cx, y: cy };
          
          activeWire.setAttribute("d", `M ${cx},${cy} L ${cx},${cy}`);
          activeWire.style.opacity = "1";
        });
        
        pin.addEventListener("mouseup", e => {
          e.stopPropagation();
          if (isDrawingWire && startPin && startPin.compId !== cId) {
            createWire(startPin.compId, startPin.pinId, cId, pin.dataset.pid);
          }
          finishWireDrawing();
        });
      });
    }

    // --- FLOATING TOOLS ---
    function createFloatingTool(type, x, y) {
      floatIdCounter++;
      const tId = `t${floatIdCounter}`;
      
      const tmpl = document.getElementById(`tmpl-${type}`);
      if (!tmpl) return;
      
      const clone = tmpl.content.cloneNode(true);
      const box = clone.querySelector('.floating-tool');
      box.id = tId;
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      
      let floatObj = { id: tId, type: type, x: x, y: y, el: box };

      if(type === 'voltmeter') {
          const pR = document.createElement("div"); pR.className = "probe-point red";
          const pB = document.createElement("div"); pB.className = "probe-point black";
          pR.style.left = `${x + 80}px`; pR.style.top = `${y + 10}px`;
          pB.style.left = `${x - 80}px`; pB.style.top = `${y + 10}px`;
          workspace.appendChild(pR); workspace.appendChild(pB);
          
          const wR = document.createElementNS("http://www.w3.org/2000/svg", "path"); wR.classList.add("probe-wire", "red");
          const wB = document.createElementNS("http://www.w3.org/2000/svg", "path"); wB.classList.add("probe-wire", "black");
          wiringLayer.appendChild(wR); wiringLayer.appendChild(wB);

          floatObj.probeRed = { el: pR, wireel: wR, attachedPin: null, x: x+80, y: y+10 };
          floatObj.probeBlack = { el: pB, wireel: wB, attachedPin: null, x: x-80, y: y+10 };
          
          setupProbe(floatObj.probeRed, tId);
          setupProbe(floatObj.probeBlack, tId);
      }
      
      floatingTools[tId] = floatObj;
      workspace.appendChild(box);
      
      setupFloatingInteraction(box, tId);
      if(type === 'voltmeter') updateProbeWires(tId);
      simulateCircuit();
    }

    function setupFloatingInteraction(box, tId) {
      box.addEventListener("mousedown", e => {
        e.preventDefault(); e.stopPropagation();
        selectItem('floating', tId);
        
        let startX = e.clientX; let startY = e.clientY;
        let initLeft = parseFloat(box.style.left);
        let initTop = parseFloat(box.style.top);
  
        function onMouseMove(ev) {
          const dx = ev.clientX - startX; const dy = ev.clientY - startY;
          floatingTools[tId].x = initLeft + dx;
          floatingTools[tId].y = initTop + dy;
          box.style.left = `${floatingTools[tId].x}px`;
          box.style.top = `${floatingTools[tId].y}px`;
          if (floatingTools[tId].type === 'voltmeter') updateProbeWires(tId);
          if (floatingTools[tId].type === 'ammeter') simulateCircuit();
        }
        function onMouseUp() {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          simulateCircuit();
        }
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    }

    function setupProbe(probeObj, tId) {
         probeObj.el.addEventListener("mousedown", e => {
            e.preventDefault(); e.stopPropagation();
            probeObj.attachedPin = null;
            probeObj.el.classList.remove("snapped");
            
            let startX = e.clientX; let startY = e.clientY;
            let initLeft = parseFloat(probeObj.el.style.left);
            let initTop = parseFloat(probeObj.el.style.top);
            
            function onMouseMove(ev) {
               probeObj.x = initLeft + (ev.clientX - startX);
               probeObj.y = initTop + (ev.clientY - startY);
               probeObj.el.style.left = `${probeObj.x}px`;
               probeObj.el.style.top = `${probeObj.y}px`;
               updateProbeWires(tId);
            }
            function onMouseUp(ev) {
               document.removeEventListener("mousemove", onMouseMove);
               document.removeEventListener("mouseup", onMouseUp);
               
               let snapped = false;
               const rectP = probeObj.el.getBoundingClientRect();
               const tipX = rectP.left + rectP.width/2;
               const tipY = rectP.bottom;
               
               const pins = document.querySelectorAll('.pin');
               for(let pin of pins) {
                   const r = pin.getBoundingClientRect();
                   const cx = r.left + r.width/2;
                   const cy = r.top + r.height/2;
                   const dist = Math.hypot(tipX - cx, tipY - cy);
                   if (dist < 20) {
                       const wsRect = workspace.getBoundingClientRect();
                       probeObj.x = cx - wsRect.left;
                       probeObj.y = cy - wsRect.top;
                       probeObj.el.style.left = `${probeObj.x}px`;
                       probeObj.el.style.top = `${probeObj.y}px`;
                       probeObj.attachedPin = `${pin.closest('.comp-box').id}_${pin.dataset.pid}`;
                       probeObj.el.classList.add("snapped");
                       snapped = true;
                       break;
                   }
               }
               updateProbeWires(tId);
               simulateCircuit();
            }
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
         });
    }

    function updateProbeWires(tId) {
        let t = floatingTools[tId];
        if(!t || t.type !== 'voltmeter') return;
        const bX = t.x; const bY = t.y + 20;
        
        if(t.probeRed) {
           const px = t.probeRed.x; const py = t.probeRed.y - 45;
           const midY = (bY + py) / 2 + 30;
           t.probeRed.wireel.setAttribute("d", `M ${bX},${bY} C ${bX},${midY} ${px},${midY} ${px},${py}`);
        }
        if(t.probeBlack) {
           const px = t.probeBlack.x; const py = t.probeBlack.y - 45;
           const midY = (bY + py) / 2 + 30;
           t.probeBlack.wireel.setAttribute("d", `M ${bX},${bY} C ${bX},${midY} ${px},${midY} ${px},${py}`);
        }
    }
  
    // --- WIRING SYSTEM ---
    workspace.addEventListener("mousemove", e => {
      if (isDrawingWire && startPin) {
        const wsRect = workspace.getBoundingClientRect();
        const mx = e.clientX - wsRect.left;
        const my = e.clientY - wsRect.top;
        
        let cRot = components[startPin.compId].rotation || 0;
        let a1 = startPin.pinId == "1" ? 180 : 0;
        a1 = (a1 + cRot) * Math.PI / 180;
        
        const offset = 25;
        const ex1 = startPin.x + Math.cos(a1) * offset;
        const ey1 = startPin.y + Math.sin(a1) * offset;
        
        // Dynamic Orthogonal Draw (7-Segment flexible)
        let path = `M ${startPin.x},${startPin.y} L ${ex1},${ey1} `;
        path += `L ${mx},${ey1} L ${mx},${my} `;
        
        activeWire.setAttribute("d", path);
      }
      
      if (draggingWire) {
          const wsRect = workspace.getBoundingClientRect();
          draggingWire.dragX = e.clientX - wsRect.left;
          draggingWire.dragY = e.clientY - wsRect.top;
          drawWireLoc(draggingWire);
      }
    });
  
    document.addEventListener("mouseup", () => {
      if (draggingWire) {
          draggingWire = null;
      }
      if (isDrawingWire) finishWireDrawing();
    });
  
    workspace.addEventListener("mousedown", (e) => {
        if(e.target === workspace || e.target === wiringLayer) {
           selectItem(null, null);
        }
    });
  
    function finishWireDrawing() {
      isDrawingWire = false;
      startPin = null;
      activeWire.style.opacity = "0";
    }
  
    function createWire(c1, p1, c2, p2) {
      if (wires.some(w => (w.c1===c1 && w.p1===p1 && w.c2===c2 && w.p2===p2) || 
                          (w.c1===c2 && w.p1===p2 && w.c2===c1 && w.p2===p1))) return;
                          
      const wId = `w${Date.now()}`;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.classList.add("wire-path");
      path.id = wId;
      wiringLayer.appendChild(path);
  
      const wire = { id: wId, c1, p1, c2, p2, el: path, powered: false };
      wires.push(wire);
      
      components[c1].pins[p1].connections.push({ wireId: wId, destC: c2, destP: p2 });
      components[c2].pins[p2].connections.push({ wireId: wId, destC: c1, destP: p1 });
  
      path.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          selectItem('wire', wId);
          if (!document.body.classList.contains("mode-delete")) {
              draggingWire = wire;
          }
      });
  
      drawWireLoc(wire);
      simulateCircuit();
    }
  
    function updateWiresConnectedTo(cId) {
      wires.forEach(w => {
        if (w.c1 === cId || w.c2 === cId) drawWireLoc(w);
      });
    }
  
    function drawWireLoc(wire) {
      const el1 = components[wire.c1].el.querySelector(`[data-pid="${wire.p1}"]`);
      const el2 = components[wire.c2].el.querySelector(`[data-pid="${wire.p2}"]`);
      if(!el1 || !el2) return;
      
      const wsRect = workspace.getBoundingClientRect();
      const r1 = el1.getBoundingClientRect();
      const r2 = el2.getBoundingClientRect();
  
      const x1 = r1.left - wsRect.left + r1.width/2;
      const y1 = r1.top - wsRect.top + r1.height/2;
      const x2 = r2.left - wsRect.left + r2.width/2;
      const y2 = r2.top - wsRect.top + r2.height/2;
  
      // Orthogonal (Manhattan) logic untuk gaya diagram rangkaian
      // Membaca rotasi komponen agar kabel keluar dari pin (outward) dengan benar
      let c1Rot = components[wire.c1].rotation || 0;
      let a1 = wire.p1 == "1" ? 180 : 0;
      a1 = (a1 + c1Rot) * Math.PI / 180;

      let c2Rot = components[wire.c2].rotation || 0;
      let a2 = wire.p2 == "1" ? 180 : 0;
      a2 = (a2 + c2Rot) * Math.PI / 180;
      
      const offset = 30; // Margin agar tidak bertabrakan

      // Ekstensi titik keluar dari pin
      const ex1 = Math.round(x1 + Math.cos(a1) * offset);
      const ey1 = Math.round(y1 + Math.sin(a1) * offset);
      
      const ex2 = Math.round(x2 + Math.cos(a2) * offset);
      const ey2 = Math.round(y2 + Math.sin(a2) * offset);

      // Titik engsel (waypoint drag) pengguna, jika belum ada, pakai titik tengah
      const px = wire.dragX !== undefined ? wire.dragX : (ex1 + ex2) / 2;
      const py = wire.dragY !== undefined ? wire.dragY : (ey1 + ey2) / 2;

      // Router Sudut Presisi (7-Segment Orthogonal)
      // Mampu ditarik ke segala arah tanpa pernah kehilangan sudut 90 derajat
      let path = `M ${x1},${y1} L ${ex1},${ey1} `;
      path += `L ${px},${ey1} L ${px},${py} L ${ex2},${py} L ${ex2},${ey2} `;
      path += `L ${x2},${y2}`;

      wire.el.setAttribute("d", path);
    }
  
    // --- SELECTION & DELETION ---
    function selectItem(type, id) {
      selectedItem = { type, id };
      
      Object.values(components).forEach(c => c.el.classList.remove("selected"));
      Object.values(floatingTools).forEach(t => t.el.classList.remove("selected"));
      wires.forEach(w => w.el.style.stroke = "");
  
      if (type === 'comp' && id) {
        components[id].el.classList.add("selected");
      } else if (type === 'wire' && id) {
        const w = wires.find(x => x.id === id);
        if(w) w.el.style.stroke = "#ff4757";
      } else if (type === 'floating' && id) {
        floatingTools[id].el.classList.add("selected");
      }
    }
  
    btnRotate.addEventListener("click", () => {
      if (!selectedItem || selectedItem.type !== 'comp') return;
      rotateComponent(selectedItem.id);
    });

    btnDelete.addEventListener("click", () => {
      if (!selectedItem) return;
      if (selectedItem.type === 'comp') deleteComponent(selectedItem.id);
      if (selectedItem.type === 'wire') deleteWire(selectedItem.id);
      if (selectedItem.type === 'floating') deleteFloating(selectedItem.id);
      selectedItem = null;
    });
  
    btnClear.addEventListener("click", () => {
      Object.keys(components).forEach(deleteComponent);
      Object.keys(floatingTools).forEach(deleteFloating);
      selectedItem = null;
    });
  
    document.addEventListener("keydown", (e) => {
        if(propModal.classList.contains("show")) return; 
        
        if(e.key === "Delete" || e.key === "Backspace") {
            if (!selectedItem) return;
            if (selectedItem.type === 'comp') deleteComponent(selectedItem.id);
            if (selectedItem.type === 'wire') deleteWire(selectedItem.id);
            if (selectedItem.type === 'floating') deleteFloating(selectedItem.id);
            selectedItem = null;
        } else if (e.key === "r" || e.key === "R") {
            if (selectedItem && selectedItem.type === 'comp') {
                rotateComponent(selectedItem.id);
            }
        }
    });

    function rotateComponent(id) {
        if(!components[id]) return;
        let c = components[id];
        c.rotation = (c.rotation + 90) % 360;
        // Apply rotation, but preserve the base centering translate
        c.el.style.transform = `translate(-50%, -50%) rotate(${c.rotation}deg)`;
        
        // Let the DOM update its transforms, then force wire coordinates update
        // Use requestAnimationFrame to ensure bounding checks run after CSS transform is applied paint-wise (mostly required for some browsers, but synchronous is usually fine)
        requestAnimationFrame(() => {
            updateWiresConnectedTo(id);
        });
    }
  
    function deleteComponent(id) {
      if(!components[id]) return;
      const connectedWires = wires.filter(w => w.c1 === id || w.c2 === id);
      connectedWires.forEach(w => deleteWire(w.id));
      
      components[id].el.remove();
      delete components[id];
      simulateCircuit();
    }
  
    function deleteFloating(id) {
        if(!floatingTools[id]) return;
        let t = floatingTools[id];
        t.el.remove();
        if(t.type === 'voltmeter') {
            if(t.probeRed) { t.probeRed.el.remove(); t.probeRed.wireel.remove(); }
            if(t.probeBlack) { t.probeBlack.el.remove(); t.probeBlack.wireel.remove(); }
        }
        delete floatingTools[id];
        simulateCircuit();
    }

    function deleteWire(id) {
      const idx = wires.findIndex(w => w.id === id);
      if(idx === -1) return;
      const w = wires[idx];
      w.el.remove();
      
      components[w.c1].pins[w.p1].connections = components[w.c1].pins[w.p1].connections.filter(x => x.wireId !== id);
      components[w.c2].pins[w.p2].connections = components[w.c2].pins[w.p2].connections.filter(x => x.wireId !== id);
      
      wires.splice(idx, 1);
      simulateCircuit();
    }
  
    // --- ADVANCED NODAL ANALYSIS (MNA) PHYSICS ENGINE ---
    function simulateCircuit() {
        if(isCircuitBroken) return;
        
        // 1. Reset Visual States
        Object.values(components).forEach(c => {
            if(c.type !== 'switch') c.state = 'off';
            c.el.classList.remove('powered');
            const realM = c.el.querySelector('.real-meter-text');
            const schemaM = c.el.querySelector('.schema-meter-text');
            if(realM) realM.textContent = "0.0";
            if(schemaM) schemaM.textContent = (c.type === 'ammeter' ? '0.00A' : '0.0V');
        });
        wires.forEach(w => {
            w.powered = false;
            w.el.classList.remove("powered");
        });

        // 2. Build Pin Nodes
        let pinNodes = {};
        let nodeCount = 1; // Node 0 is implicit Ground (0V)
        Object.values(components).forEach(c => {
            pinNodes[`${c.id}_1`] = nodeCount++; // Left Pin
            pinNodes[`${c.id}_2`] = nodeCount++; // Right Pin
        });

        const numBatteries = Object.values(components).filter(c => c.type === 'battery').length;
        const numVars = nodeCount - 1 + numBatteries;
        
        if (numVars === 0) return;

        let A = Array(numVars).fill(0).map(() => Array(numVars).fill(0));
        let b = Array(numVars).fill(0);

        function addG(n1, n2, g) {
            if (n1 > 0) A[n1 - 1][n1 - 1] += g;
            if (n2 > 0) A[n2 - 1][n2 - 1] += g;
            if (n1 > 0 && n2 > 0) {
                A[n1 - 1][n2 - 1] -= g;
                A[n2 - 1][n1 - 1] -= g;
            }
        }

        // 3. Add Weak Ground Connections (to ensure non-singular matrix)
        for(let i = 1; i < nodeCount; i++) {
            addG(i, 0, 1e-6); // 1 M-Ohm resistor to ground acts as anti-floating anchor
        }

        // 4. Formulate Component Equations
        let battIndex = 0;
        Object.values(components).forEach(c => {
            let n1 = pinNodes[`${c.id}_1`];
            let n2 = pinNodes[`${c.id}_2`];
            
            if (c.type === 'resistor') {
                let R = Math.max(0.001, parseFloat(c.value) || 10);
                addG(n1, n2, 1 / R);
            } else if (c.type === 'lamp') {
                addG(n1, n2, 1 / 10); // Lamp acts as a 10-ohm resistor
            } else if (c.type === 'switch') {
                let R = c.state === 'closed' ? 1e-4 : 1e6;
                addG(n1, n2, 1 / R);
            } else if (c.type === 'ammeter') {
                addG(n1, n2, 1 / 1e-4);
            } else if (c.type === 'voltmeter') {
                addG(n1, n2, 1 / 1e6);
            } else if (c.type === 'battery') {
                let eq = (nodeCount - 1) + battIndex;
                let V = parseFloat(c.value) || 12;
                
                // Construct MNA auxiliary equation: V_{n2} - V_{n1} + I_b * R_int = V_battery
                if (n2 > 0) {
                    A[n2 - 1][eq] += 1;
                    A[eq][n2 - 1] += 1;
                }
                if (n1 > 0) {
                    A[n1 - 1][eq] -= 1;
                    A[eq][n1 - 1] -= 1;
                }
                A[eq][eq] = 1e-3; // Include a 1 milliohm internal battery resistance
                b[eq] = V;
                battIndex++;
            }
        });

        // 5. Formulate Wire Equations
        wires.forEach(w => {
            let n1 = pinNodes[`${w.c1}_${w.p1}`];
            let n2 = pinNodes[`${w.c2}_${w.p2}`];
            addG(n1, n2, 1 / 1e-4); // Wires simulated as 0.1 mOhm conductor
        });

        // 6. Gaussian Elimination Solver
        function solveSystem() {
            let n = b.length;
            let x = new Array(n).fill(0);
            for (let p = 0; p < n; p++) {
                let max = p;
                for (let i = p + 1; i < n; i++) if (Math.abs(A[i][p]) > Math.abs(A[max][p])) max = i;
                let tA = A[p]; A[p] = A[max]; A[max] = tA;
                let tb = b[p]; b[p] = b[max]; b[max] = tb;
                
                if (Math.abs(A[p][p]) <= 1e-12) return x; 
                
                for (let i = p + 1; i < n; i++) {
                    let alpha = A[i][p] / A[p][p];
                    b[i] -= alpha * b[p];
                    for (let j = p; j < n; j++) A[i][j] -= alpha * A[p][j];
                }
            }
            for (let i = n - 1; i >= 0; i--) {
                let sum = 0;
                for (let j = i + 1; j < n; j++) sum += A[i][j] * x[j];
                x[i] = (b[i] - sum) / A[i][i];
            }
            return x;
        }

        let x = solveSystem();
        let getV = (nodeId) => nodeId === 0 ? 0 : x[nodeId - 1];

        // 7. Extract Outputs and Update UI
        battIndex = 0;
        Object.values(components).forEach(c => {
            let n1 = pinNodes[`${c.id}_1`];
            let n2 = pinNodes[`${c.id}_2`];
            let v1 = getV(n1);
            let v2 = getV(n2);
            let cur = 0;
            
            if (c.type === 'battery') {
                cur = x[(nodeCount - 1) + battIndex];
                battIndex++;
            } else if (c.type === 'resistor') {
                let R = Math.max(0.001, parseFloat(c.value) || 10);
                cur = (v2 - v1) / R; 
            } else if (c.type === 'lamp') {
                cur = (v2 - v1) / 10;
            } else if (c.type === 'switch') {
                let R = c.state === 'closed' ? 1e-4 : 1e6;
                cur = (v2 - v1) / R;
            }

            let absCur = Math.abs(cur);
            c.current = cur;
            
            // Check for short circuit (Overload > 15 Amperes)
            if (absCur > 15.0) {
                triggerShortCircuit(c);
            }
            
            // Visual powering 
            if (c.type === 'lamp') {
                if (absCur >= 0.05) { c.state = 'powered'; c.el.classList.add("powered"); }
            } else if (c.type === 'resistor') {
                if (absCur >= 0.01) { c.state = 'powered'; c.el.classList.add("powered"); }
            }
        });

        wires.forEach(w => {
            let n1 = pinNodes[`${w.c1}_${w.p1}`];
            let n2 = pinNodes[`${w.c2}_${w.p2}`];
            let v1 = getV(n1);
            let v2 = getV(n2);
            let cur = (v2 - v1) / 1e-4;
            w.current = cur;
            
            if (Math.abs(cur) >= 0.01 && !isCircuitBroken) {
                w.powered = true;
                w.el.classList.add("powered");
                // Dynamic Animation: higher current = faster electron flow
                // Max speed 0.02s, Min speed 2.0s
                let dur = Math.max(0.02, Math.min(2.0, 0.4 / Math.abs(cur)));
                w.el.style.animationDuration = dur + "s";
            } else {
                w.el.classList.remove("powered");
                w.el.style.animationDuration = "";
            }
        });

        // 8. Update Floating Tools
        Object.values(floatingTools).forEach(t => {
            if (t.type === 'voltmeter') {
                let val = 0.0;
                let c1 = t.probeRed.attachedPin;
                let c2 = t.probeBlack.attachedPin;
                if (c1 && c2 && pinNodes[c1] !== undefined && pinNodes[c2] !== undefined) {
                    val = getV(pinNodes[c1]) - getV(pinNodes[c2]);
                }
                const rT = t.el.querySelector('.real-meter-text');
                if(rT) rT.textContent = Math.abs(val).toFixed(2);
            } else if (t.type === 'ammeter') {
                const cross = t.el.querySelector('.target-crosshair');
                let cur = 0;
                if (cross) {
                    const rect = cross.getBoundingClientRect();
                    const cx = rect.left + rect.width/2;
                    const cy = rect.top + rect.height/2;
                    
                    t.el.style.pointerEvents = 'none'; // so we raycast through tool body if needed
                    let elements = document.elementsFromPoint(cx, cy);
                    t.el.style.pointerEvents = 'auto'; // restore

                    if (elements) {
                        for (let el of elements) {
                            if (el.tagName === 'path' && el.classList.contains('wire-path')) {
                                let hw = wires.find(w => w.id === el.id);
                                if(hw) { cur = hw.current || 0; break; }
                            }
                            let cp = el.closest('.comp-box');
                            if (cp) {
                                let hc = components[cp.id];
                                if(hc) { cur = hc.current || 0; break; }
                            }
                        }
                    }
                }
                const rT = t.el.querySelector('.real-meter-text');
                if(rT) rT.textContent = Math.abs(cur).toFixed(2);
            }
        });
    }

    function triggerShortCircuit(c) {
        if(isCircuitBroken) return;
        isCircuitBroken = true;
        c.el.classList.add("shorted");
        
        // Add Smoke FX SVG
        if(!c.el.querySelector(".smoke-fx")) {
            const smokeObj = document.createElement("div");
            smokeObj.className = "smoke-fx";
            smokeObj.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="80" r="15" fill="#ff4757">
                    <animate attributeName="cy" values="80;40;10" dur="1s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="1;0.5;0" dur="1s" repeatCount="indefinite"/>
                    <animate attributeName="r" values="15;25;35" dur="1s" repeatCount="indefinite"/>
                </circle>
                <circle cx="30" cy="70" r="10" fill="#ffa502">
                    <animate attributeName="cy" values="70;30;0" dur="1.2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="1;0.5;0" dur="1.2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="70" cy="75" r="12" fill="#57606f">
                    <animate attributeName="cy" values="75;20;-10" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.8;0.3;0" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="r" values="12;30;40" dur="1.5s" repeatCount="indefinite"/>
                </circle>
            </svg>`;
            c.el.appendChild(smokeObj);
        }
        
        toastOverload.classList.add("show");
        
        // Zero everything else visually
        wires.forEach(w => {
           w.el.classList.remove("powered");
           w.el.style.animationDuration = "";
        });
    }

    // Initial Tick
    simulateCircuit();
});

// ==========================================
// KODE TAMBAHAN: SCHEMA VIEWER & SCREENSHOT
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Schema Modal Logic
    const btnSchema = document.getElementById("btn-schema-modal");
    const modalSchema = document.getElementById("schemaViewerModal");
    const btnCloseSchema = document.getElementById("schemaCloseBtn");
    const schemaSelect = document.getElementById("schemaSelect");
    const schemaCanvas = document.getElementById("schemaCanvas");

    const svgs = {
      "1": `<svg viewBox="0 0 400 200" style="width:100%; height:auto;"><polyline points="100,110 100,150 300,150 300,50 220,50" stroke="#00d4ff" stroke-width="2" fill="none"/><polyline points="180,50 100,50 100,90" stroke="#00d4ff" stroke-width="2" fill="none"/><line x1="85" y1="90" x2="115" y2="90" stroke="#fff" stroke-width="2"/><line x1="92" y1="110" x2="108" y2="110" stroke="#fff" stroke-width="4"/><text x="75" y="105" fill="#fff" font-size="14" text-anchor="end">12V</text><rect x="180" y="42" width="40" height="16" fill="transparent" stroke="#ff8c00" stroke-width="2" rx="2" /><text x="200" y="32" fill="#ff8c00" font-size="14" text-anchor="middle">R</text></svg>`,
      "2": `<svg viewBox="0 0 400 200" style="width:100%; height:auto;"><polyline points="100,110 100,150 300,150 300,120" stroke="#00d4ff" stroke-width="2" fill="none"/><polyline points="300,80 300,50 100,50 100,90" stroke="#00d4ff" stroke-width="2" fill="none"/><line x1="200" y1="50" x2="200" y2="80" stroke="#00d4ff" stroke-width="2"/><line x1="200" y1="120" x2="200" y2="150" stroke="#00d4ff" stroke-width="2"/><line x1="85" y1="90" x2="115" y2="90" stroke="#fff" stroke-width="2"/><line x1="92" y1="110" x2="108" y2="110" stroke="#fff" stroke-width="4"/><text x="75" y="105" fill="#fff" font-size="14" text-anchor="end">12V</text><rect x="192" y="80" width="16" height="40" fill="transparent" stroke="#ff8c00" stroke-width="2" rx="2"/><text x="220" y="105" fill="#ff8c00" font-size="14">R1</text><rect x="292" y="80" width="16" height="40" fill="transparent" stroke="#ff8c00" stroke-width="2" rx="2"/><text x="320" y="105" fill="#ff8c00" font-size="14">R2</text></svg>`,
      "3": `<svg viewBox="0 0 400 200" style="width:100%; height:auto;"><polyline points="100,110 100,150 300,150 300,120" stroke="#00d4ff" stroke-width="2" fill="none" /><polyline points="300,80 300,50 220,50" stroke="#00d4ff" stroke-width="2" fill="none" /><polyline points="180,50 100,50 100,90" stroke="#00d4ff" stroke-width="2" fill="none" /><line x1="85" y1="90" x2="115" y2="90" stroke="#fff" stroke-width="2"/><line x1="92" y1="110" x2="108" y2="110" stroke="#fff" stroke-width="4"/><text x="75" y="105" fill="#fff" font-size="14" text-anchor="end">24V</text><rect x="180" y="42" width="40" height="16" fill="transparent" stroke="#ff8c00" stroke-width="2" rx="2" /><text x="200" y="32" fill="#ff8c00" font-size="14" text-anchor="middle">R1</text><rect x="292" y="80" width="16" height="40" fill="transparent" stroke="#ff8c00" stroke-width="2" rx="2" /><text x="320" y="105" fill="#ff8c00" font-size="14">R2</text></svg>`,
      "4": `<svg viewBox="0 0 400 200" style="width:100%; height:auto;"><polyline points="100,110 100,150 320,150 320,50 300,50" stroke="#00d4ff" stroke-width="2" fill="none" /><polyline points="130,50 100,50 100,90" stroke="#00d4ff" stroke-width="2" fill="none" /><line x1="170" y1="50" x2="200" y2="50" stroke="#00d4ff" stroke-width="2" /><circle cx="200" cy="50" r="3" fill="#00d4ff" /><circle cx="300" cy="50" r="3" fill="#00d4ff" /><polyline points="200,50 200,20 230,20" stroke="#00d4ff" stroke-width="2" fill="none" /><polyline points="270,20 300,20 300,50" stroke="#00d4ff" stroke-width="2" fill="none" /><polyline points="200,50 200,80 230,80" stroke="#00d4ff" stroke-width="2" fill="none" /><polyline points="270,80 300,80 300,50" stroke="#00d4ff" stroke-width="2" fill="none" /><line x1="85" y1="90" x2="115" y2="90" stroke="#fff" stroke-width="2"/><line x1="92" y1="110" x2="108" y2="110" stroke="#fff" stroke-width="4"/><text x="75" y="105" fill="#fff" font-size="14" text-anchor="end">30V</text><rect x="130" y="42" width="40" height="16" fill="transparent" stroke="#ff8c00" stroke-width="2" rx="2" /><text x="150" y="32" fill="#ff8c00" font-size="12" text-anchor="middle">R1</text><rect x="230" y="12" width="40" height="16" fill="transparent" stroke="#ff8c00" stroke-width="2" rx="2" /><text x="250" y="8" fill="#ff8c00" font-size="12" text-anchor="middle">R2</text><rect x="230" y="72" width="40" height="16" fill="transparent" stroke="#ff8c00" stroke-width="2" rx="2" /><text x="250" y="105" fill="#ff8c00" font-size="12" text-anchor="middle">R3</text></svg>`
    };

    if(btnSchema) {
       btnSchema.addEventListener('click', () => {
          modalSchema.classList.add('active');
          schemaCanvas.innerHTML = svgs[schemaSelect.value];
       });
       btnCloseSchema.addEventListener('click', () => modalSchema.classList.remove('active'));
       schemaSelect.addEventListener('change', (e) => {
          schemaCanvas.innerHTML = svgs[e.target.value];
       });
    }

    // 2. html2canvas screenshot logic
    const btnCapture = document.getElementById("btn-capture");
    const toastNotif = document.getElementById("toastNotif");
    if(btnCapture) {
       btnCapture.addEventListener('click', () => {
          const ws = document.getElementById('workspace');
          // Temporarily ensure wire SVGs aren't cut off by weird overflowing issues
          html2canvas(ws, {
             backgroundColor: '#0a1525',
             logging: false
          }).then(canvas => {
             const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
             // Save to localStorage as an array
             let snaps = [];
             try {
                 const stored = localStorage.getItem('vlab_screenshots');
                 if(stored) snaps = JSON.parse(stored);
             } catch(e) {}
             
             snaps.push(dataUrl);
             if(snaps.length > 5) snaps.shift(); // Limit to 5 images
             localStorage.setItem('vlab_screenshots', JSON.stringify(snaps));
             
             // Keep the old key for backward compatibility just in case
             localStorage.setItem('vlab_screenshot', dataUrl);
             
             // Show toast
             toastNotif.classList.add('show');
             setTimeout(() => { toastNotif.classList.remove('show'); }, 3500);
          }).catch(err => {
             console.error("Gagal mengambil gambar simulasi", err);
          });
       });
    }
});
