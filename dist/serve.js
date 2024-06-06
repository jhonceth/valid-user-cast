"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Configuración del servidor Express
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.post('/receiveData', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user, frameData } = req.body;
        // Verificación inicial para asegurarse de que user y frameData existen
        if (!user || !frameData) {
            console.error('Datos del usuario y frameData son necesarios');
            return res.status(400).send('Datos del usuario y frameData son necesarios');
        }
        // Extraer y verificar datos de frameData y User
        const { hash } = frameData.castId;
        const { fid } = user;
        if (!fid || !hash) {
            console.error('Datos de fid y hash son necesarios');
            return res.status(400).send('Datos de fid y hash son necesarios');
        }
        // Imprimir datos de userid y del usuario (opcional)
        console.log('fid:', fid);
        console.log('hash:', hash);
        console.log('Usuario:', user.username);
        console.log('Nombre de pantalla:', user.displayName);
        // Lógica de Neynar (integrada y adaptada)
        const neynarUrl = `https://api.neynar.com/v2/farcaster/reactions/cast?hash=${hash}&types=recast&limit=25`;
        const options = {
            method: 'GET',
            headers: { accept: 'application/json', api_key: process.env.API_KEY || '' }
        };
        const response = yield fetch(neynarUrl, options);
        const json = yield response.json();
        // Validar que la respuesta JSON tiene la forma esperada
        if (typeof json === 'object' && json !== null && Array.isArray(json.reactions) && 'cursor' in json) {
            const neynarData = json;
            const reactions = neynarData.reactions;
            let successObject = { success: false }; // Inicializamos el objeto de éxito como falso por defecto
            reactions.forEach(reaction => {
                if (reaction.reaction_type === 'recast' && reaction.user.object === 'user' && reaction.user.fid === fid) {
                    successObject = { success: true }; // Cambiamos el éxito a verdadero si se cumple la condición
                }
            });
            console.log(successObject); // Devolvemos el objeto de éxito
            res.json(successObject); // Enviar la respuesta al cliente
        }
        else {
            throw new Error('Respuesta de la API de Neynar no tiene el formato esperado');
        }
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al procesar los datos recibidos');
    }
}));
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
