const { db } = require('../config/database');

const resolvers = {
    Query: {
        
        eventos(root, { id }) {
            if (id === undefined) {
                return db.any('SELECT * FROM evento ORDER BY eve_id');
            } else {
                return db.any('SELECT * FROM evento WHERE eve_id = $1', [id]);
            }
        },
        eventosID(root, { id }) {
            if (id === undefined) {

                return db.any('SELECT * FROM evento WHERE eve_id = $1', [id]);
            } else {
                return db.any('SELECT * FROM evento WHERE eve_id = $1', [id]);
            }

            
        },     
        participantes(root, { id }) {
            if (id === undefined) {
                return db.any('SELECT * FROM participante ORDER BY par_id');
            } else {
                return db.any('SELECT * FROM participante WHERE par_id = $1', [id]);
            }
        },
        
  
        async salasConEventos() {
            return db.any(`
                SELECT s.sal_id, s.sal_nombre,e.eve_nombre, e.eve_costo
                FROM sala s
                LEFT JOIN evento e ON s.sal_id = e.sal_id
                ORDER BY s.sal_id, e.eve_id
            `);
        },

        
        async eventoConParticipantes(root, { eve_id }) {
            return db.any(`
                SELECT
                  e.eve_nombre,
                    p.par_cedula,
                    p.par_nombre,
                    ep.evepar_cantidad as eve_par_pago
                FROM evento e
                LEFT JOIN evento_participante ep ON e.eve_id = ep.eve_id
                LEFT JOIN participante p ON ep.par_id = p.par_id
                WHERE e.eve_id = $1
                ORDER BY p.par_id
            `, [eve_id]);
        },

        async salasEventosParticipante(root, { par_id }) {
            return db.any(`
                SELECT 
                   s.sal_nombre,
                    e.eve_nombre,
                    e.eve_costo,
                    p.par_nombre,
                    ep.evepar_cantidad as eve_par_pago
                FROM sala s
                JOIN evento e ON s.sal_id = e.sal_id
                JOIN evento_participante ep ON e.eve_id = ep.eve_id
                JOIN participante p ON ep.par_id = p.par_id
                WHERE p.par_id = $1
                ORDER BY e.eve_id
            `, [par_id]);
        }
    },

    Mutation: {
       
        async crearEvento(root, { evento }) {
            try {
                if (!evento) {
                    return null;
                }

                const result = await db.one(
                    'INSERT INTO evento (sal_id, eve_nombre, eve_costo) VALUES ($1, $2, $3) RETURNING *',
                    [evento.sal_id, evento.eve_nombre, evento.eve_costo]
                );

                return result;
            } catch (error) {
                console.error('Error creando evento:', error);
                throw new Error('Failed to create evento');
            }
        },
        async actualizarEvento(root, { evento }) {
            try {
                if (!evento || evento.eve_id == null) {
                    console.error('eve_id is missing in the input');
                    return null;
                }

                const result = await db.one(
                    `UPDATE evento
                     SET sal_id = $1, eve_nombre = $2, eve_costo = $3
                     WHERE eve_id = $4
                     RETURNING *`,
                    [evento.sal_id, evento.eve_nombre, evento.eve_costo, evento.eve_id]
                );

                return result;
            } catch (error) {
                console.error('Error actualizando evento:', error);
                throw new Error('Failed to update evento');
            }
        },     
        async eliminarEvento(root, { evento }) {
            try {
                if (!evento || evento.eve_id == null) {
                    console.error('eve_id is missing in the input');
                    return null;
                }

                await db.none(
                    'DELETE FROM evento_participante WHERE eve_id = $1',
                    [evento.eve_id]
                );
                const result = await db.one(
                    'DELETE FROM evento WHERE eve_id = $1 RETURNING *',
                    [evento.eve_id]
                );

                return result;
            } catch (error) {
                console.error('Error eliminando evento:', error);
                throw new Error('Failed to delete evento');
            }
        },
        async asignarParticipanteEvento(root, { eventoParticipante }) {
            try {
                if (!eventoParticipante) {
                    return null;
                }

                const result = await db.one(
                    `INSERT INTO evento_participante (eve_id, par_id, evepar_cantidad) 
                     VALUES ($1, $2, $3) 
                     RETURNING *`,
                    [eventoParticipante.eve_id, eventoParticipante.par_id, eventoParticipante.evepar_cantidad]
                );

                return result;
            } catch (error) {
                console.error('Error asignando participante a evento:', error);
                throw new Error('Failed to assign participante to evento');
            }
        },  
        async eliminarParticipanteEvento(root, { eventoParticipante }) {
            try {
                if (!eventoParticipante || eventoParticipante.eve_id == null || eventoParticipante.par_id == null) {
                    console.error('eve_id or par_id is missing in the input');
                    return null;
                }

                const result = await db.one(
                    `DELETE FROM evento_participante 
                     WHERE eve_id = $1 AND par_id = $2 
                     RETURNING *`,
                    [eventoParticipante.eve_id, eventoParticipante.par_id]
                );

                return result;
            } catch (error) {
                console.error('Error eliminando participante de evento:', error);
                throw new Error('Failed to remove participante from evento');
            }
        },
    }
};

module.exports = resolvers;