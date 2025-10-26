// jogos.data.js — Rodada 29
window.RODADA = 29;

window.CLUBES = {
  262:{key:'FLA',name:'Flamengo',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/FLA/60x60.png'},
  263:{key:'BOT',name:'Botafogo',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/BOT/60x60.png'},
  264:{key:'COR',name:'Corinthians',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/COR/60x60.png'},
  265:{key:'BAH',name:'Bahia',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/BAH/60x60.png'},
  266:{key:'FLU',name:'Fluminense',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/FLU/60x60.png'},
  267:{key:'VAS',name:'Vasco',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/VAS/60x60.png'},
  275:{key:'PAL',name:'Palmeiras',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/PAL/60x60.png'},
  276:{key:'SAO',name:'São Paulo',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/SAO/60x60.png'},
  277:{key:'SAN',name:'Santos',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/SAN/60x60.png'},
  280:{key:'RBB',name:'Bragantino',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/RBB/60x60.png'},
  282:{key:'CAM',name:'Atlético-MG',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/CAM/60x60.png'},
  283:{key:'CRU',name:'Cruzeiro',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/CRU/60x60.png'},
  284:{key:'GRE',name:'Grêmio',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/GRE/60x60.png'},
  285:{key:'INT',name:'Internacional',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/INT/60x60.png'},
  286:{key:'JUV',name:'Juventude',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/JUV/60x60.png'},
  287:{key:'VIT',name:'Vitória',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/VIT/60x60.png'},
  292:{key:'SPT',name:'Sport',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/SPT/60x60.png'},
  354:{key:'CEA',name:'Ceará',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/CEA/60x60.png'},
  356:{key:'FOR',name:'Fortaleza',escudo:'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2025/escudos/FOR/60x60.png'},
  2305:{key:'MIR',name:'Mirassol',escudo:'https://s.glbimg.com/es/sde/f/organizacoes/escudo_default_65x65.png'}
};

// key do jogo → clube_id
window.TEAMKEY_TO_CLUBEID = {
  'corinthians_v2':264,
  'atletico-mg_v2':282,
  'cruzeiro_v2':283,
  'fortaleza_v2':356,
  'flamengo_v2':262,
  'palmeiras_v2':275,
  'mirassol_v2':2305,
  'sao-paulo_v2':276,
  'internacional_v2':285,
  'sport_v2':292,
  'ceara_v2':354,
  'botafogo_v2':263,
  'bahia_v2':265,
  'gremio_v2':284,
  'juventude_v2':286,
  'bragantino_v2':280,
  'vasco_v2':267,
  'fluminense_v2':266,
  'santos_v2':277,
  'vitoria_v2':287
};

// slug → clube_id
window.SLUG_TO_ID = {
  corinthians:264, atletico:282, cruzeiro:283, fortaleza:356,
  flamengo:262, palmeiras:275, mirassol:2305, saopaulo:276,
  internacional:285, sport:292, ceara:354, botafogo:263,
  bahia:265, gremio:284, juventude:286, bragantino:280,
  vasco:267, fluminense:266, santos:277, vitoria:287
};

// lista de jogos - 31ª rodada (ordem correta)
window.JOGOS = [
  { id:"jogo-01", home:{ key:"santos_v2", name:"Santos", slug:"santos" }, away:{ key:"fortaleza_v2", name:"Fortaleza", slug:"fortaleza" } },
  { id:"jogo-02", home:{ key:"cruzeiro_v2", name:"Cruzeiro", slug:"cruzeiro" }, away:{ key:"vitoria_v2", name:"Vitória", slug:"vitoria" } },
  { id:"jogo-03", home:{ key:"mirassol_v2", name:"Mirassol", slug:"mirassol" }, away:{ key:"botafogo_v2", name:"Botafogo", slug:"botafogo" } },
  { id:"jogo-04", home:{ key:"flamengo_v2", name:"Flamengo", slug:"flamengo" }, away:{ key:"sport_v2", name:"Sport", slug:"sport" } },
  { id:"jogo-05", home:{ key:"corinthians_v2", name:"Corinthians", slug:"corinthians" }, away:{ key:"gremio_v2", name:"Grêmio", slug:"gremio" } },
  { id:"jogo-06", home:{ key:"bahia_v2", name:"Bahia", slug:"bahia" }, away:{ key:"bragantino_v2", name:"Red Bull Bragantino", slug:"bragantino" } },
  { id:"jogo-07", home:{ key:"ceara_v2", name:"Ceará", slug:"ceara" }, away:{ key:"fluminense_v2", name:"Fluminense", slug:"fluminense" } },
  { id:"jogo-08", home:{ key:"internacional_v2", name:"Internacional", slug:"internacional" }, away:{ key:"atletico-mg_v2", name:"Atlético-MG", slug:"atletico" } },
  { id:"jogo-09", home:{ key:"juventude_v2", name:"Juventude", slug:"juventude" }, away:{ key:"palmeiras_v2", name:"Palmeiras", slug:"palmeiras" } },
  { id:"jogo-10", home:{ key:"vasco_v2", name:"Vasco", slug:"vasco" }, away:{ key:"sao-paulo_v2", name:"São Paulo", slug:"saopaulo" } }
];

