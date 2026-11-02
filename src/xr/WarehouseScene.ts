import * as THREE from 'three';
import * as xb from 'xrblocks';
import { DatabaseService } from '../services/db';
import { MusicService } from '../services/musicService';
import { formatETB } from '../utils/i18n';

export class WarehouseScene extends xb.Script {
  private db = DatabaseService.getInstance();
  private music = MusicService.getInstance();

  private statusCard?: xb.UICard;
  private posCard?: xb.UICard;
  private musicCard?: xb.UICard;
  private palletsGroup = new THREE.Group();
  private stockLabels: THREE.Group[] = [];

  init() {
    // 1. Lighting setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 2.2);
    this.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    dirLight.position.set(4, 10, 5);
    dirLight.castShadow = true;
    this.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-6, 4, -4);
    this.add(fillLight);

    // 2. Warehouse Environment (Polished Concrete Floor & Markings)
    this.buildWarehouseFloor();

    // 3. 3D Pallets of Building Materials
    this.buildMaterialPallets();

    // 4. Spatial UI: Warehouse Live KPI Card
    this.buildStatusCard();

    // 5. Spatial UI: Quick POS Dispenser Kiosk Card
    this.buildPosCard();

    // 6. Spatial UI: 3D Music & Lyria Audio Card
    this.buildMusicCard();
  }

  private buildWarehouseFloor() {
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.add(floor);

    // Yellow safety warehouse aisle walkways
    const aisleGeo = new THREE.PlaneGeometry(1.6, 20);
    const aisleMat = new THREE.MeshBasicMaterial({
      color: 0xeab308,
      transparent: true,
      opacity: 0.25,
    });
    const aisle = new THREE.Mesh(aisleGeo, aisleMat);
    aisle.rotation.x = -Math.PI / 2;
    aisle.position.set(0, 0.005, -2);
    this.add(aisle);
  }

  private buildMaterialPallets() {
    this.add(this.palletsGroup);

    // 1. Cement Pallet (Dangote / Mugher 50kg Bags stacked)
    const cementPallet = this.createCementPallet();
    cementPallet.position.set(-1.8, 0, -2.4);
    this.palletsGroup.add(cementPallet);
    this.createFloatingLabel(cementPallet, 'Dangote Cement 42.5R', '340 Bags (In Stock)');

    // 2. Steel Rebar Rack (12mm Grade 60 bundles)
    const steelRack = this.createSteelRebarRack();
    steelRack.position.set(1.8, 0, -2.4);
    this.palletsGroup.add(steelRack);
    this.createFloatingLabel(steelRack, 'Deformed Rebar 12mm', '45 Quintals (In Stock)');

    // 3. Corrugated Roofing Sheets Stack (G32 Iron Sheets)
    const roofingStack = this.createRoofingStack();
    roofingStack.position.set(-2.0, 0, -0.6);
    this.palletsGroup.add(roofingStack);
    this.createFloatingLabel(roofingStack, 'Galvanized Sheets G32', '520 Pcs (In Stock)');

    // 4. Kadisco Paint Buckets & Barrels
    const paintPallet = this.createPaintPallet();
    paintPallet.position.set(2.0, 0, -0.6);
    this.palletsGroup.add(paintPallet);
    this.createFloatingLabel(paintPallet, 'Kadisco Paints & Enamel', '92 Buckets (In Stock)');
  }

  private createWoodPallet(): THREE.Group {
    const pallet = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.9,
    });

    // Pallet boards
    for (let i = -0.5; i <= 0.5; i += 0.25) {
      const topBoard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.025, 0.12), woodMat);
      topBoard.position.set(0, 0.12, i);
      pallet.add(topBoard);
    }

    // Stringers
    for (const x of [-0.5, 0, 0.5]) {
      const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 1.1), woodMat);
      stringer.position.set(x, 0.05, 0);
      pallet.add(stringer);
    }
    return pallet;
  }

  private createCementPallet(): THREE.Group {
    const group = this.createWoodPallet();
    const bagGeo = new THREE.BoxGeometry(0.32, 0.12, 0.48);
    const bagMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Dangote gray kraft paper
      roughness: 0.85,
    });

    // Stack 3 layers of 4 bags
    for (let layer = 0; layer < 3; layer++) {
      const y = 0.18 + layer * 0.12;
      for (const x of [-0.2, 0.2]) {
        for (const z of [-0.25, 0.25]) {
          const bag = new THREE.Mesh(bagGeo, bagMat);
          bag.position.set(x, y, z);
          // Slight natural misalignment
          bag.rotation.y = (Math.random() - 0.5) * 0.05;
          group.add(bag);
        }
      }
    }
    return group;
  }

  private createSteelRebarRack(): THREE.Group {
    const group = new THREE.Group();
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });

    // A-frame metal rack
    for (const z of [-0.6, 0.6]) {
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), rackMat);
      postL.position.set(-0.35, 0.45, z);
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), rackMat);
      postR.position.set(0.35, 0.45, z);
      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.06, 0.06), rackMat);
      cross.position.set(0, 0.2, z);
      group.add(postL, postR, cross);
    }

    // Cylindrical rebar rods (bundle)
    const rebarMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.35,
    });
    const rebarGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.8, 12);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        const bar = new THREE.Mesh(rebarGeo, rebarMat);
        bar.rotation.x = Math.PI / 2;
        bar.position.set(-0.25 + c * 0.1, 0.3 + r * 0.08, 0);
        group.add(bar);
      }
    }

    // Yellow identification tag for Grade 60
    const tag = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, 0.01),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
    );
    tag.position.set(0, 0.5, 0.91);
    group.add(tag);

    return group;
  }

  private createRoofingStack(): THREE.Group {
    const group = this.createWoodPallet();
    const sheetMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd, // Galvanized light metallic blue-gray
      metalness: 0.85,
      roughness: 0.25,
    });

    const sheetGeo = new THREE.BoxGeometry(0.85, 0.015, 1.2);
    for (let i = 0; i < 16; i++) {
      const sheet = new THREE.Mesh(sheetGeo, sheetMat);
      sheet.position.set(0, 0.15 + i * 0.02, 0);
      group.add(sheet);
    }
    return group;
  }

  private createPaintPallet(): THREE.Group {
    const group = this.createWoodPallet();
    const bucketGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.42, 16);
    const bucketMatWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const bucketMatBlue = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 }); // Red lid (Kadisco style)

    let idx = 0;
    for (const x of [-0.3, 0.3]) {
      for (const z of [-0.3, 0.3]) {
        const bucket = new THREE.Mesh(bucketGeo, idx % 2 === 0 ? bucketMatWhite : bucketMatBlue);
        bucket.position.set(x, 0.34, z);
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.03, 16), lidMat);
        lid.position.set(x, 0.55, z);
        group.add(bucket, lid);
        idx++;
      }
    }
    return group;
  }

  private createFloatingLabel(parent: THREE.Group, title: string, subtitle: string) {
    const card = new xb.UICard({
      size: { width: 0.48, height: 'auto' },
      pointerEvents: 'none',
      style: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        borderRadius: 12,
        gap: 4,
      },
      children: [
        new xb.UIText({
          text: title,
          style: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', textAlign: 'center' },
        }),
        new xb.UIText({
          text: subtitle,
          style: { fontSize: 13, color: '#38bdf8', textAlign: 'center' },
        }),
      ],
    });

    card.position.set(0, 1.25, 0);
    card.add(new xb.FaceCamera({ mode: 'spherical', smoothing: 1 }));
    parent.add(card);
  }

  // Live Warehouse Status Monitor Card
  private buildStatusCard() {
    const metrics = this.db.getDashboardMetrics();

    const title = new xb.UIText({
      text: 'CHERCHER STORE & YARD MONITOR',
      style: { fontSize: 20, fontWeight: 'bold', color: '#38bdf8', textAlign: 'center' },
    });

    const stockVal = new xb.UIText({
      text: `Stock Value: ${formatETB(metrics.currentStockValue)}`,
      style: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
    });

    const salesToday = new xb.UIText({
      text: `Today's Sales: ${formatETB(metrics.totalSalesToday)}`,
      style: { fontSize: 15, color: '#4ade80' },
    });

    const lowStock = new xb.UIText({
      text: `Low Stock Alerts: ${metrics.lowStockCount} items requiring reorder`,
      style: { fontSize: 14, color: metrics.lowStockCount > 0 ? '#f87171' : '#4ade80' },
    });

    const refreshBtn = new xb.UIButton({
      label: 'Refresh Stock',
      icon: 'refresh',
      style: { width: '100%', height: 38 },
      onClick: () => {
        const m = this.db.getDashboardMetrics();
        stockVal.text = `Stock Value: ${formatETB(m.currentStockValue)}`;
        salesToday.text = `Today's Sales: ${formatETB(m.totalSalesToday)}`;
        lowStock.text = `Low Stock Alerts: ${m.lowStockCount} items requiring reorder`;
      },
    });

    this.statusCard = new xb.UICard({
      size: { width: 0.65, height: 'auto' },
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 12,
        padding: 18,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderRadius: 16,
      },
      children: [
        new xb.UIExitButton(),
        title,
        new xb.UIPanel({
          style: {
            flexDirection: 'column',
            gap: 6,
            padding: 10,
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            borderRadius: 10,
          },
          children: [stockVal, salesToday, lowStock],
        }),
        refreshBtn,
      ],
    });

    this.statusCard.position.set(-0.7, 1.45, -1.3);
    this.statusCard.rotation.y = 0.25;
    this.add(this.statusCard);
  }

  // Quick 3D POS Dispenser Kiosk
  private buildPosCard() {
    const feedbackText = new xb.UIText({
      text: 'Select building material to dispense in XR:',
      style: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
    });

    // Find actual catalog items
    const cementProd = this.db.products.find((p) => p.name.includes('Dangote')) || this.db.products[0];
    const rebarProd = this.db.products.find((p) => p.name.includes('Rebar 12mm')) || this.db.products[1];

    const sellCementBtn = new xb.UIButton({
      label: `Dispense 10 Bags ${cementProd.name.split('(')[0].trim()} (${formatETB(cementProd.sellingPrice * 10)})`,
      icon: 'shopping_cart',
      style: { width: '100%', height: 40 },
      onClick: () => {
        const res = this.db.createSale({
          customerName: 'XR Warehouse Walk-in Contractor',
          items: [{ productId: cementProd.id, quantity: 10 }],
          discount: 0,
          paymentMethod: 'cash',
          paidAmount: cementProd.sellingPrice * 10,
          notes: 'Direct physical fulfillment from 3D XR Warehouse terminal.',
        });
        if (res.success) {
          const updated = this.db.products.find((p) => p.id === cementProd.id);
          feedbackText.text = `Dispensed! Invoice ${res.sale?.invoiceNumber} created. Remaining stock: ${updated?.quantity} ${updated?.unit}.`;
          this.music.playProceduralTrack('fanfare');
        } else {
          feedbackText.text = `Error: ${res.error}`;
        }
      },
    });

    const sellRebarBtn = new xb.UIButton({
      label: `Dispense 2 Quintals ${rebarProd.name.split('Grade')[0].trim()} (${formatETB(rebarProd.sellingPrice * 2)})`,
      icon: 'construction',
      style: { width: '100%', height: 40 },
      onClick: () => {
        const res = this.db.createSale({
          customerName: 'XR Warehouse Walk-in Contractor',
          items: [{ productId: rebarProd.id, quantity: 2 }],
          discount: 0,
          paymentMethod: 'telebirr',
          paidAmount: rebarProd.sellingPrice * 2,
          notes: 'Fulfilled from Steel Yard via XR terminal.',
        });
        if (res.success) {
          const updated = this.db.products.find((p) => p.id === rebarProd.id);
          feedbackText.text = `Dispensed! Invoice ${res.sale?.invoiceNumber} created. Remaining stock: ${updated?.quantity} ${updated?.unit}.`;
          this.music.playProceduralTrack('fanfare');
        } else {
          feedbackText.text = `Error: ${res.error}`;
        }
      },
    });

    this.posCard = new xb.UICard({
      size: { width: 0.65, height: 'auto' },
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 12,
        padding: 18,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderRadius: 16,
      },
      children: [
        new xb.UIText({
          text: '3D POS DISPENSER',
          style: { fontSize: 22, fontWeight: 'bold', color: '#eab308', textAlign: 'center' },
        }),
        feedbackText,
        sellCementBtn,
        sellRebarBtn,
      ],
    });

    this.posCard.position.set(0.7, 1.45, -1.3);
    this.posCard.rotation.y = -0.25;
    this.add(this.posCard);
  }

  // 3D Music & Lyria Audio Card
  private buildMusicCard() {
    const trackInfo = new xb.UIText({
      text: this.music.currentTrackTitle,
      style: { fontSize: 14, color: '#f8fafc', textAlign: 'center' },
    });

    const playToggleBtn = new xb.UIButton({
      label: 'Play / Stop Store Ambient Music',
      icon: 'music_note',
      style: { width: '100%', height: 40 },
      onClick: () => {
        this.music.togglePlay();
        trackInfo.text = this.music.isPlaying ? this.music.currentTrackTitle : 'Audio stopped';
      },
    });

    const lyriaBtn = new xb.UIButton({
      label: 'Generate Lyria Ethiopian Track',
      icon: 'auto_awesome',
      style: { width: '100%', height: 40 },
      onClick: async () => {
        trackInfo.text = 'Generating with Gemini Lyria-3...';
        const res = await this.music.generateLyriaTrack(
          'Energetic Ethiopian traditional masinqo rhythm for busy construction store',
          (msg) => {
            trackInfo.text = msg;
          },
        );
        trackInfo.text = res.track ? res.track.title : this.music.currentTrackTitle;
      },
    });

    this.musicCard = new xb.UICard({
      size: { width: 0.58, height: 'auto' },
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 12,
        padding: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderRadius: 16,
      },
      children: [
        new xb.UIText({
          text: 'CHERCHER AUDIO JUKEBOX',
          style: { fontSize: 18, fontWeight: 'bold', color: '#c084fc', textAlign: 'center' },
        }),
        trackInfo,
        playToggleBtn,
        lyriaBtn,
      ],
    });

    this.musicCard.position.set(0, 0.9, -1.2);
    this.add(this.musicCard);
  }

  update() {
    // Gentle floating animation for pallets or markers if desired
  }
}
