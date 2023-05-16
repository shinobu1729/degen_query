import axios from "axios";
import fs from "fs/promises";

async function fetchBeacons(cursor = null) {
  const params = {
    limit: 200,
    ...(cursor ? { cursor } : {}),
  };
  const response = await axios.get("https://beacon.degenscore.com/v1/beacons", { params });
  return response.data;
}

function filterRecentBeacons(beacons, days) {
  const currentDate = new Date();
  const dateThreshold = new Date(currentDate.setDate(currentDate.getDate() - days));

  return beacons.filter((beacon) => {
    const updatedAtDate = new Date(beacon.updatedAt);
    return updatedAtDate > dateThreshold;
  });
}

async function getAllBeacons() {
  let allBeacons = [];
  let nextCursor = null;

  do {
    const response = await fetchBeacons(nextCursor);
    const recentBeacons = filterRecentBeacons(response.beacons, 110);
    allBeacons = allBeacons.concat(recentBeacons);
    nextCursor = response.meta.nextCursor;
    console.log("nextCursor", nextCursor);

    if (nextCursor) {
      await sleep(1000); // Wait for 1 second before the next iteration
    }
  } while (nextCursor);

  return allBeacons;
}

async function writeBeaconsToFile(beacons, fileName) {
  try {
    const jsonString = JSON.stringify(beacons, null, 2);
    await fs.writeFile(fileName, jsonString);
    console.log(`Beacons have been saved to ${fileName}`);
  } catch (error) {
    console.error("Failed to save beacons to a file:", error);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  try {
    const beacons = await getAllBeacons();
    await writeBeaconsToFile(beacons, "beacons.json");

    const simplifiedBeacons = beacons.map((beacon) => ({ address: beacon.address }));
    await writeBeaconsToFile(simplifiedBeacons, "simplifiedBeacons.json");
  } catch (error) {
    console.error("Failed to fetch all beacons:", error);
  }
})();
