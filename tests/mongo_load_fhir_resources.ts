import fs from "fs";
import { MongoClient } from "mongodb";
import path from "path";
import { Config } from "../src/config";

function loadFhirToMongoDB() {
    let config: Config = require('../config.json');
    const uri = config.mongoDBConnectionString;
    // Create a MongoClient with a MongoClientOptions object to set the Stable API version
    const client = new MongoClient(uri)

    try {
        // Connect the client to the server (optional starting in v4.7)
        const client = new MongoClient(uri);
        // Send a ping to confirm a successful connection
        const database = client.db("fhir-server");
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const folderPath = path.join(__dirname, '../tests', 'synthea_sample_data_fhir_latest');
        const files = fs.readdirSync(folderPath);
        console.log("processing files");

        files.slice(0, 5).forEach((file) => {
            const filePath = path.join(folderPath, file);
            const fileData = fs.readFileSync(filePath, 'utf8');
            const fhirBundle = JSON.parse(fileData);

            fhirBundle.entry.forEach((entry) => {
                const resource = entry.resource;
                const collection = database.collection(resource.resourceType.toLowerCase() + "s");

                collection.insertOne({
                    "metadata": {
                        "documentVersion": "1.0",
                        "fhirVersion": "4.0.0",
                        "lastUpdate": new Date().toISOString(),
                        "tenant_id": "Tenant",
                        "id": resource.id,
                        "resourceType": resource.resourceType,
                    },
                    "resource": resource,
                    // Add more properties as needed
                });
            });
        });

        console.log("loaded resources to MongoDB successfully!");
    } finally {
        // Ensures that the client will close when you finish/error
        client.close();
    }
}

loadFhirToMongoDB();