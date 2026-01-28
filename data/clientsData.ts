
export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  time: string;
  avatar?: string;
  initials?: string;
  color?: string;
  active: boolean;
  online?: boolean;
  grayscale?: boolean;
  cpf: string;
  age: string;
  status: 'Ativo' | 'Pendente' | 'Arquivado';
  location?: string;
  phones?: { cell: string; res?: string; com?: string };
  // Previdenciário
  pis?: string;
  nb?: string;
  motherName?: string;
  inssPassword?: string;
  dependents?: { name: string; relation: string; birthDate?: string; cpf?: string }[];
  cnisLinks?: { company: string; entryDate: string; exitDate?: string; type: string; status: 'Validado' | 'Pendente' }[];
  docsChecklist?: { name: string; status: 'Validado' | 'Pendente' | 'Faltando' | 'Opcional'; mandatory: boolean; icon: string }[];
}

// Armazenamento mutável para simular persistência entre navegação
export const clientsData: Contact[] = [
  { id: '1', name: 'Sr. João da Silva', role: 'Aposentadoria Especial', company: 'Metalúrgico', time: '14:30', avatar: 'https://i.pravatar.cc/150?img=11', active: true, online: true, cpf: '123.456.789-00', age: '58 anos', status: 'Ativo', location: 'São Paulo, SP', phones: { cell: '(11) 99999-1111' }, pis: '123.45678.90-0', motherName: 'Maria da Silva', inssPassword: 'senha_segura_123' },
  { id: '2', name: 'Dona Maria Oliveira', role: 'Pensão por Morte', company: 'Doméstica', time: 'Ontem', avatar: 'https://i.pravatar.cc/150?img=5', active: false, cpf: '987.654.321-11', age: '64 anos', status: 'Ativo', location: 'Rio de Janeiro, RJ', phones: { cell: '(21) 98888-2222' }, motherName: 'Francisca Oliveira', pis: '987.65432.10-0', nb: '123.456.789-1' },
  { id: '3', name: 'Pedro Santos', role: 'BPC/LOAS', company: 'Deficiente', time: '23 Out', avatar: 'https://i.pravatar.cc/150?img=3', active: false, online: true, cpf: '456.789.123-22', age: '22 anos', status: 'Pendente', location: 'Curitiba, PR', phones: { cell: '(41) 97777-3333' }, motherName: 'Regina Santos', pis: '456.78912.33-4' },
  { id: '4', name: 'Ana Costa', role: 'Salário Maternidade', company: 'Rural', time: '21 Out', initials: 'AC', color: 'purple', active: false, cpf: '321.654.987-33', age: '29 anos', status: 'Ativo', location: 'Interior, MG', phones: { cell: '(31) 96666-4444' } },
  { id: '5', name: 'Carlos Souza', role: 'Auxílio Doença', company: 'Motorista', time: '15 Out', avatar: 'https://i.pravatar.cc/150?img=68', active: false, grayscale: true, cpf: '741.852.963-44', age: '45 anos', status: 'Arquivado', location: 'São Paulo, SP' },
  { id: '6', name: 'Roberto Almeida', role: 'Aposentadoria Idade', company: 'Autônomo', time: '10 Out', initials: 'RA', color: 'blue', active: false, cpf: '852.963.741-55', age: '67 anos', status: 'Ativo', location: 'Campinas, SP' },
  { id: '7', name: 'Fernanda Lima', role: 'Pensão por Morte', company: 'Autônoma', time: '09:00', avatar: 'https://i.pravatar.cc/150?img=32', active: true, cpf: '111.222.333-44', age: '42 anos', status: 'Ativo', location: 'Porto Alegre, RS' },
  { id: '8', name: 'Ricardo Gomes', role: 'Aposentadoria Invalidez', company: 'Construção Civil', time: '05 Nov', initials: 'RG', color: 'orange', active: false, cpf: '222.333.444-55', age: '55 anos', status: 'Pendente', location: 'Belo Horizonte, MG' },
  { id: '9', name: 'Patrícia Rocha', role: 'Salário Maternidade', company: 'Vendedora', time: '03 Nov', avatar: 'https://i.pravatar.cc/150?img=44', active: false, cpf: '333.444.555-66', age: '28 anos', status: 'Arquivado', location: 'Salvador, BA' },
  { id: '10', name: 'Luiz Mendes', role: 'BPC/LOAS', company: 'Desempregado', time: '01 Nov', initials: 'LM', color: 'teal', active: false, cpf: '444.555.666-77', age: '68 anos', status: 'Ativo', location: 'Recife, PE' },
  { id: '11', name: 'Cláudia Alves', role: 'Auxílio Doença', company: 'Enfermeira', time: '30 Out', avatar: 'https://i.pravatar.cc/150?img=25', active: true, online: true, cpf: '555.666.777-88', age: '35 anos', status: 'Ativo', location: 'São Paulo, SP' },
  { id: '12', name: 'Sérgio Reis', role: 'Aposentadoria Idade', company: 'Rural', time: '28 Out', avatar: 'https://i.pravatar.cc/150?img=12', active: false, cpf: '666.777.888-99', age: '72 anos', status: 'Pendente', location: 'Goiânia, GO' },
  { id: '13', name: 'Juliana Paiva', role: 'Pensão por Morte', company: 'Professora', time: '25 Out', initials: 'JP', color: 'pink', active: false, cpf: '777.888.999-00', age: '40 anos', status: 'Ativo', location: 'Rio de Janeiro, RJ' },
  { id: '14', name: 'Marcos Silva', role: 'BPC/LOAS', company: 'Autônomo', time: '20 Out', avatar: 'https://i.pravatar.cc/150?img=53', active: false, grayscale: true, cpf: '888.999.000-11', age: '21 anos', status: 'Arquivado', location: 'Manaus, AM' },
  { id: '15', name: 'Ivana Santos', role: 'Aposentadoria Especial', company: 'Química', time: '15 Out', avatar: 'https://i.pravatar.cc/150?img=9', active: true, cpf: '999.000.111-22', age: '52 anos', status: 'Ativo', location: 'Campinas, SP' },
  { id: '16', name: 'Fábio Junior', role: 'Auxílio Acidente', company: 'Metalúrgico', time: '10 Out', initials: 'FJ', color: 'indigo', active: false, cpf: '000.111.222-33', age: '48 anos', status: 'Pendente', location: 'Osasco, SP' },
];

export const addClient = (newClient: Contact) => {
  clientsData.unshift(newClient);
};
