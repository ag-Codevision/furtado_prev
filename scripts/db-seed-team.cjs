const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Omeg%40256489%40256489@db.dnakrupxobjwfbhygtuk.supabase.co:5432/postgres';

const initialMembers = [
    {
        name: 'Dr. Silva',
        role: 'Sócio-Diretor',
        department: 'Jurídico',
        email: 'silva@furtadoprev.com.br',
        phone: '(41) 99988-7766',
        avatar: 'https://i.pravatar.cc/150?u=1',
        status: 'Ativo',
        oab: 'PR 123.456',
        admission_date: '2020-01-01',
        bio: 'Especialista em Direito Previdenciário com foco em RMI e revisões de alta complexidade.'
    },
    {
        name: 'Dra. Oliveira',
        role: 'Advogada Senior',
        department: 'Jurídico',
        email: 'oliveira@furtadoprev.com.br',
        phone: '(41) 98877-6655',
        avatar: 'https://i.pravatar.cc/150?u=2',
        status: 'Ativo',
        oab: 'PR 654.321',
        admission_date: '2021-03-15',
        bio: 'Atuação destacada em concessões de benefícios rurais e LOAS.'
    },
    {
        name: 'Carlos Mendes',
        role: 'Gestor Financeiro',
        department: 'Financeiro',
        email: 'financeiro@furtadoprev.com.br',
        phone: '(41) 97766-5544',
        avatar: 'https://i.pravatar.cc/150?u=3',
        status: 'Ativo',
        admission_date: '2022-06-01',
        bio: 'Responsável pela saúde financeira e controle de honorários do escritório.'
    },
    {
        name: 'Mariana Souza',
        role: 'Secretária Executiva',
        department: 'Administrativo',
        email: 'contato@furtadoprev.com.br',
        phone: '(41) 96655-4433',
        avatar: 'https://i.pravatar.cc/150?u=4',
        status: 'Ativo',
        admission_date: '2023-01-10',
        bio: 'Primeiro contato com o cliente e organização de pautas e agendamentos.'
    }
];

async function seedTeam() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();

        // Verifica se já existem membros
        const res = await client.query('SELECT count(*) FROM public.team_members');
        if (parseInt(res.rows[0].count) === 0) {
            console.log('Semeando membros iniciais da equipe...');
            for (const member of initialMembers) {
                await client.query(
                    'INSERT INTO public.team_members (name, role, department, email, phone, avatar, status, oab, admission_date, bio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [member.name, member.role, member.department, member.email, member.phone, member.avatar, member.status, member.oab, member.admission_date, member.bio]
                );
            }
            console.log('Equipe semeada com sucesso!');
        } else {
            console.log('A tabela team_members já possui dados. Pulando semeadura.');
        }
    } catch (err) {
        console.error('Erro ao semear equipe:', err);
    } finally {
        await client.end();
    }
}

seedTeam();
