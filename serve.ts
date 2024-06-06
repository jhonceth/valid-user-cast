import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

// Interfaces para los datos del usuario de Farcaster
interface Profile {
  bio: {
    text: string;
    mentions: any[];
    channelMentions: any[];
  };
  location: {
    placeId: string;
    description: string;
  };
}

interface Pfp {
  url: string;
  verified: boolean;
}

interface User {
  fid: number;
  username: string;
  displayName: string;
  pfp: Pfp;
  profile: Profile;
  followerCount: number;
  followingCount: number;
  activeOnFcNetwork: boolean;
  viewerContext: {
    following: boolean;
    followedBy: boolean;
    canSendDirectCasts: boolean;
    enableNotifications: boolean;
    hasUploadedInboxKeys: boolean;
  };
}

// Interfaces para los datos del cast de Farcaster
interface CastId {
  fid: number;
  hash: string;
}

interface FrameData {
  fid: number;
  url: string;
  messageHash: string;
  timestamp: number;
  network: number;
  buttonIndex: number;
  castId: CastId;
}

interface RequestBody {
  user: User;
  frameData: FrameData;
}

// Interfaz para la respuesta de la API de Neynar
interface NeynarReaction {
  reaction_type: string;
  reaction_timestamp: string;
  object: string;
  user: {
    object: string;
    fid: number;
    custody_address: string;
    username: string;
    display_name: string;
    pfp_url: string;
    profile: {
      bio: {
        text: string;
      };
    };
    follower_count: number;
    following_count: number;
    verifications: string[];
    verified_addresses: {
      eth_addresses: string[];
      sol_addresses: string[];
    };
    active_status: string;
    power_badge: boolean;
  };
}

interface NeynarData {
  reactions: NeynarReaction[];
  cursor: null | string;
}

// Configuración del servidor Express
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

app.post('/receiveData', async (req: Request<any, any, RequestBody>, res: Response) => {
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

    const response = await fetch(neynarUrl, options);
    const json: unknown = await response.json();

    // Validar que la respuesta JSON tiene la forma esperada
    if (typeof json === 'object' && json !== null && Array.isArray((json as any).reactions) && 'cursor' in json) {
      const neynarData: NeynarData = json as NeynarData;

      const reactions = neynarData.reactions;
      let successObject = { success: false }; // Inicializamos el objeto de éxito como falso por defecto
      reactions.forEach(reaction => {
        if (reaction.reaction_type === 'recast' && reaction.user.object === 'user' && reaction.user.fid === fid) {
          successObject = { success: true }; // Cambiamos el éxito a verdadero si se cumple la condición
        }
      });
      console.log(successObject); // Devolvemos el objeto de éxito
      res.json(successObject); // Enviar la respuesta al cliente
    } else {
      throw new Error('Respuesta de la API de Neynar no tiene el formato esperado');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error al procesar los datos recibidos');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
