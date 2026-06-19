import * as bcrypt from 'bcryptjs';
import { generateId } from '../../common/utils/ulid.util';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const addDays = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

export const CITY_IDS = {
  maringa: generateId(TABLE_PREFIX.CITY),
  curitiba: generateId(TABLE_PREFIX.CITY),
  paicandu: generateId(TABLE_PREFIX.CITY),
};

export const CATEGORY_IDS = {
  saude: generateId(TABLE_PREFIX.CATEGORY),
  alimentacao: generateId(TABLE_PREFIX.CATEGORY),
  educacao: generateId(TABLE_PREFIX.CATEGORY),
  turismo: generateId(TABLE_PREFIX.CATEGORY),
  servicoPublico: generateId(TABLE_PREFIX.CATEGORY),
};

export const ADMIN_IDS = {
  maringa: generateId(TABLE_PREFIX.USER),
  curitiba: generateId(TABLE_PREFIX.USER),
  paicandu: generateId(TABLE_PREFIX.USER),
};

export const LOCAL_IDS = {
  upaZonaSul: generateId(TABLE_PREFIX.LOCAL),
  catedral: generateId(TABLE_PREFIX.LOCAL),
  parqueInga: generateId(TABLE_PREFIX.LOCAL),
  detran: generateId(TABLE_PREFIX.LOCAL),
  escolaVidigal: generateId(TABLE_PREFIX.LOCAL),
  restaurantePopular: generateId(TABLE_PREFIX.LOCAL),
  ubsBairroAlto: generateId(TABLE_PREFIX.LOCAL),
  parqueBarigui: generateId(TABLE_PREFIX.LOCAL),
  ubsPaicandu: generateId(TABLE_PREFIX.LOCAL),
  igrejaMatriz: generateId(TABLE_PREFIX.LOCAL),
};

export const CITIES = [
  { id: CITY_IDS.maringa, name: 'Maringá', state: 'PR' },
  { id: CITY_IDS.curitiba, name: 'Curitiba', state: 'PR' },
  { id: CITY_IDS.paicandu, name: 'Paiçandu', state: 'PR' },
];

export const CATEGORIES = [
  { id: CATEGORY_IDS.saude, name: 'Saúde', icon: 'medical-cross' },
  { id: CATEGORY_IDS.alimentacao, name: 'Alimentação', icon: 'food' },
  { id: CATEGORY_IDS.educacao, name: 'Educação', icon: 'education' },
  { id: CATEGORY_IDS.turismo, name: 'Turismo', icon: 'tourism' },
  {
    id: CATEGORY_IDS.servicoPublico,
    name: 'Serviço Público',
    icon: 'public-service',
  },
];

export async function buildAdmins(
  superAdminId: string,
  superAdminEmail: string,
  superAdminPassword: string,
  adminPassword: string,
) {
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  const superPassword = await bcrypt.hash(superAdminPassword, 10);
  return {
    superAdmin: {
      id: superAdminId,
      name: 'Super Admin',
      email: superAdminEmail,
      password: superPassword,
      role: 'ADMIN' as const,
      cityId: null,
    },
    admins: [
      {
        id: ADMIN_IDS.maringa,
        name: 'Admin Maringá',
        email: 'admin.maringa@conecta.local',
        password: hashedAdminPassword,
        role: 'ADMIN' as const,
        cityId: CITY_IDS.maringa,
      },
      {
        id: ADMIN_IDS.curitiba,
        name: 'Admin Curitiba',
        email: 'admin.curitiba@conecta.local',
        password: hashedAdminPassword,
        role: 'ADMIN' as const,
        cityId: CITY_IDS.curitiba,
      },
      {
        id: ADMIN_IDS.paicandu,
        name: 'Admin Paiçandu',
        email: 'admin.paicandu@conecta.local',
        password: hashedAdminPassword,
        role: 'ADMIN' as const,
        cityId: CITY_IDS.paicandu,
      },
    ],
  };
}

export const LOCALS = [
  {
    id: LOCAL_IDS.upaZonaSul,
    name: 'UPA Zona Sul',
    description: 'Unidade de Pronto Atendimento 24h na região sul de Maringá.',
    address: 'R. Pioneiro Augusto Lopes Penteado, 890 - Zona 08, Maringá - PR',
    phone: '(44) 3221-0000',
    cityId: CITY_IDS.maringa,
    categoryId: CATEGORY_IDS.saude,
    userId: ADMIN_IDS.maringa,
    lat: -23.4421,
    lng: -51.9228,
  },
  {
    id: LOCAL_IDS.catedral,
    name: 'Catedral de Maringá',
    description:
      'Catedral Nossa Senhora da Glória, símbolo arquitetônico de Maringá.',
    address: 'Praça Pe. Anchieta, s/n - Centro, Maringá - PR',
    phone: '(44) 3222-2699',
    cityId: CITY_IDS.maringa,
    categoryId: CATEGORY_IDS.turismo,
    userId: ADMIN_IDS.maringa,
    lat: -23.4273,
    lng: -51.9386,
  },
  {
    id: LOCAL_IDS.parqueInga,
    name: 'Parque do Ingá',
    description:
      'Parque municipal com lago, trilhas e fauna nativa em pleno centro de Maringá.',
    address: 'Av. Laguna, s/n - Zona 05, Maringá - PR',
    phone: '(44) 3221-1400',
    cityId: CITY_IDS.maringa,
    categoryId: CATEGORY_IDS.turismo,
    userId: ADMIN_IDS.maringa,
    lat: -23.4253,
    lng: -51.9228,
  },
  {
    id: LOCAL_IDS.detran,
    name: 'DETRAN Maringá',
    description:
      'Departamento de Trânsito do Estado do Paraná - unidade Maringá.',
    address: 'Av. Cerro Azul, 1878 - Zona 04, Maringá - PR',
    phone: '(44) 3212-5000',
    cityId: CITY_IDS.maringa,
    categoryId: CATEGORY_IDS.servicoPublico,
    userId: ADMIN_IDS.maringa,
    lat: -23.409,
    lng: -51.923,
  },
  {
    id: LOCAL_IDS.escolaVidigal,
    name: 'Escola Estadual Dr. Gastão Vidigal',
    description: 'Escola pública estadual com ensino fundamental e médio.',
    address: 'R. João Paulino Vieira Filho, 500 - Zona 07, Maringá - PR',
    phone: '(44) 3225-5800',
    cityId: CITY_IDS.maringa,
    categoryId: CATEGORY_IDS.educacao,
    userId: ADMIN_IDS.maringa,
    lat: -23.4192,
    lng: -51.9263,
  },
  {
    id: LOCAL_IDS.restaurantePopular,
    name: 'Restaurante Popular de Maringá',
    description:
      'Refeições de qualidade a preço acessível para a população de Maringá.',
    address: 'R. Joubert de Carvalho, 629 - Zona 07, Maringá - PR',
    phone: '(44) 3221-5000',
    cityId: CITY_IDS.maringa,
    categoryId: CATEGORY_IDS.alimentacao,
    userId: ADMIN_IDS.maringa,
    lat: -23.4168,
    lng: -51.9386,
  },
  {
    id: LOCAL_IDS.ubsBairroAlto,
    name: 'UBS Bairro Alto',
    description: 'Unidade Básica de Saúde com atendimento de segunda a sábado.',
    address: 'R. Padre Agostinho, 2621 - Bairro Alto, Curitiba - PR',
    phone: '(41) 3338-0000',
    cityId: CITY_IDS.curitiba,
    categoryId: CATEGORY_IDS.saude,
    userId: ADMIN_IDS.curitiba,
    lat: -25.389,
    lng: -49.242,
  },
  {
    id: LOCAL_IDS.parqueBarigui,
    name: 'Parque Barigui',
    description:
      'Um dos maiores parques urbanos de Curitiba, com lago e área verde.',
    address: 'Rod. João Leopoldo Jacomel, s/n - Mossunguê, Curitiba - PR',
    phone: '(41) 3350-9050',
    cityId: CITY_IDS.curitiba,
    categoryId: CATEGORY_IDS.turismo,
    userId: ADMIN_IDS.curitiba,
    lat: -25.42,
    lng: -49.32,
  },
  {
    id: LOCAL_IDS.ubsPaicandu,
    name: 'UBS Municipal de Paiçandu',
    description:
      'Unidade Básica de Saúde com atendimento à população de Paiçandu.',
    address: 'R. Minas Gerais, 500 - Centro, Paiçandu - PR',
    phone: '(44) 3242-1200',
    cityId: CITY_IDS.paicandu,
    categoryId: CATEGORY_IDS.saude,
    userId: ADMIN_IDS.paicandu,
    lat: -23.4575,
    lng: -51.9897,
  },
  {
    id: LOCAL_IDS.igrejaMatriz,
    name: 'Igreja Matriz de Paiçandu',
    description:
      'Igreja Matriz Nossa Senhora de Fátima, ponto de referência do município.',
    address: 'R. Paraíba, s/n - Centro, Paiçandu - PR',
    phone: '(44) 3242-1000',
    cityId: CITY_IDS.paicandu,
    categoryId: CATEGORY_IDS.turismo,
    userId: ADMIN_IDS.paicandu,
    lat: -23.4601,
    lng: -51.9877,
  },
];

export const EVENTS = [
  {
    id: generateId(TABLE_PREFIX.EVENT),
    title: 'Feira de Saúde Preventiva',
    description:
      'Serviços gratuitos de aferição de pressão, glicemia, orientação nutricional e vacinação.',
    type: 'oficial',
    status: 'publicado',
    priority: true,
    eventDate: addDays(7),
    cityId: CITY_IDS.maringa,
    userId: ADMIN_IDS.maringa,
    localId: LOCAL_IDS.upaZonaSul,
  },
  {
    id: generateId(TABLE_PREFIX.EVENT),
    title: 'Festival do Parque do Ingá',
    description:
      'Festival cultural com música ao vivo, artesanato e gastronomia regional no Parque do Ingá.',
    type: 'cultural',
    status: 'publicado',
    priority: false,
    eventDate: addDays(14),
    cityId: CITY_IDS.maringa,
    userId: ADMIN_IDS.maringa,
    localId: LOCAL_IDS.parqueInga,
  },
  {
    id: generateId(TABLE_PREFIX.EVENT),
    title: 'Corrida Sustentável de Maringá',
    description:
      'Corrida de rua com percursos de 5km e 10km ao redor do Parque do Ingá.',
    type: 'esportivo',
    status: 'publicado',
    priority: false,
    eventDate: addDays(21),
    cityId: CITY_IDS.maringa,
    userId: ADMIN_IDS.maringa,
    localId: LOCAL_IDS.parqueInga,
  },
  {
    id: generateId(TABLE_PREFIX.EVENT),
    title: 'Dia Aberto no DETRAN',
    description:
      'Orientação sobre documentação veicular, habilitação e regularização de débitos com atendimento sem fila.',
    type: 'oficial',
    status: 'publicado',
    priority: false,
    eventDate: addDays(10),
    cityId: CITY_IDS.maringa,
    userId: ADMIN_IDS.maringa,
    localId: LOCAL_IDS.detran,
  },
  {
    id: generateId(TABLE_PREFIX.EVENT),
    title: 'Trilha Ecológica no Barigui',
    description:
      'Trilha guiada pelo Parque Barigui com foco em educação ambiental e fauna nativa.',
    type: 'esportivo',
    status: 'publicado',
    priority: false,
    eventDate: addDays(5),
    cityId: CITY_IDS.curitiba,
    userId: ADMIN_IDS.curitiba,
    localId: LOCAL_IDS.parqueBarigui,
  },
];

export const COMMUNICATES = [
  {
    id: generateId(TABLE_PREFIX.COMMUNICATE),
    title: 'Manutenção programada no sistema',
    description:
      'O sistema ficará indisponível amanhã das 2h às 4h para manutenção de infraestrutura. Serviços de emergência não serão afetados.',
    isActive: true,
    priority: false,
    cityId: CITY_IDS.maringa,
    userId: ADMIN_IDS.maringa,
  },
  {
    id: generateId(TABLE_PREFIX.COMMUNICATE),
    title: 'Novos horários de atendimento nas UBSs',
    description:
      'As UBSs de Maringá passam a funcionar: Segunda a Sexta das 7h às 17h, Sábado das 7h às 12h. UPA Zona Sul e UPA Norte permanecem 24h. Agendamentos pelo 0800 123 4567 ou presencialmente.',
    isActive: true,
    priority: true,
    cityId: CITY_IDS.maringa,
    userId: ADMIN_IDS.maringa,
  },
  {
    id: generateId(TABLE_PREFIX.COMMUNICATE),
    title: 'Recadastramento de permissões',
    description:
      'Comerciantes com alvarás vencidos em 2025 devem comparecer ao DETRAN com documentação atualizada até 31/07/2025.',
    isActive: true,
    priority: false,
    cityId: CITY_IDS.curitiba,
    userId: ADMIN_IDS.curitiba,
  },
];

export const NEWS = [
  {
    id: generateId(TABLE_PREFIX.NEWS),
    title:
      'ATI 60+: Prefeitura de Maringá lança projeto para promover atividades físicas à população idosa',
    description:
      'Iniciativa vai levar profissionais de Educação Física para Academias da Terceira Idade (ATIs) e fortalecer ações de envelhecimento ativo no município.',
    type: 'saude',
    linkType: 'externo',
    linkUrl:
      'https://www.maringa.pr.gov.br/noticias/ati-60-prefeitura-de-maringa-lanca-projeto-para-promover-atividades-fisicas-orientadas-a-populacao/42518',
    isActive: true,
    cityId: CITY_IDS.maringa,
  },
  {
    id: generateId(TABLE_PREFIX.NEWS),
    title: 'Curitiba recebe novos ônibus elétricos',
    description:
      'Prefeitura de Curitiba anuncia a incorporação de 30 novos ônibus elétricos à frota municipal, reduzindo emissões de CO₂ no transporte público.',
    type: 'infra',
    linkType: 'interno',
    linkUrl: null,
    isActive: true,
    cityId: CITY_IDS.curitiba,
  },
];
