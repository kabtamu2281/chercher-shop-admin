import * as xb from 'xrblocks';
import { PwaApp } from './ui/pwaApp';
import { WarehouseScene } from './xr/WarehouseScene';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize the 2D PWA Management Application
  const pwaContainer = document.getElementById('pwa-container');
  if (pwaContainer) {
    const pwaApp = new PwaApp(pwaContainer);
    pwaApp.init();
  }

  // 2. Initialize the 3D WebXR Warehouse Scene
  const warehouseScene = new WarehouseScene();
  xb.add(warehouseScene);

  const options = new xb.Options();
  options.setAppTitle('Chercher Building Material Retail Shop');
  options.setAppDescription('Ethiopian Building Materials ERP & 3D Spatial Warehouse');
  options.reticles.enabled = true;
  options.enableHands();
  options.hands.visualization = true;

  xb.init(options);
});
