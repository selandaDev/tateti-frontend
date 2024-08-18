import { inject, Injectable, signal } from '@angular/core';
import { EstadoJuego, PosicionTablero, PosicionGanadora, SalaBackend, Tablero } from '../interfaces/sala';
import { Jugador } from '../interfaces/jugador';
import { ServerService } from './server.service';
import { CrearSalaArgs } from '../interfaces/crearSala';
import { UnirseASalaCrearSalaArgs } from '../interfaces/unirseASala';
import { UsuarioService } from './usuario.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SalaService {

  serverService = inject(ServerService);
  usuarioService = inject(UsuarioService);
  router = inject(Router);

  constructor() {
    this.serverService.actualizacionDeSala$.subscribe((sala)=> {
      this.desestructurarSala(sala);
    })
   }
  jugador1 = signal<Jugador>({
    nombre: "",
    vidas: 0
  });
   jugador2 = signal<Jugador>({
    nombre: "",
    vidas: 0
  });
   estado = signal<EstadoJuego>("ESPERANDO_COMPAÑERO");
   numeroDeJugador = signal<1|2|undefined>(undefined);
   id = signal<number|undefined>(undefined);
   tablero = signal<Tablero>(["","","","","","","","","",]);
   publica = signal<boolean|undefined>(undefined);
   posicionGanadora = signal<PosicionGanadora | undefined>(undefined);

   desestructurarSala(salaBack:SalaBackend){
    if(!salaBack) {
      this.router.navigate(["/"]);
    }
    this.id.set(salaBack.id);
    this.estado.set(salaBack.estado);
    this.jugador1.set(salaBack.jugadores[0]);
    this.jugador2.set(salaBack.jugadores[1]);
    this.tablero.set(salaBack.tablero);
    this.publica.set(salaBack.publica);
    this.posicionGanadora.set(salaBack.posicionGanadora);
   }

   /** Crea una sala de juegos, pública o privada */
   crearSala(esPrivada:boolean = false){
    const args:CrearSalaArgs = {
      publica: !esPrivada,
      nombreJugador: this.usuarioService.nombre()
    }
    this.serverService.server.emitWithAck("crearSala",args).then(res => {
      this.desestructurarSala(res.sala);
      this.numeroDeJugador.set(1)
    })
   }

   /** Une el cliente a una sala de juegos */
   unirseASala(id: number){
    const args:UnirseASalaCrearSalaArgs = {
      id,
      nombreJugador: this.usuarioService.nombre()
    }
      this.serverService.server.emitWithAck("unirseASala",args).then(res => {
        this.desestructurarSala(res.sala);
        this.numeroDeJugador.set(2)
      })
   }

   /** Envia al server la petición de un jugador de hacer una jugada */
   jugar(posicion:PosicionTablero){
    this.serverService.server.emit("jugar",{
      salaId: this.id(),
      jugador: this.numeroDeJugador(),
      posicion
    })
   }

   /**Pide al servidor la siguiente ronda */
   nuevaRonda(){
    this.serverService.server.emit("nuevaRonda", {salaId : this.id()})
   }
}
