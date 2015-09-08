Mock.mock(/http:\/\/.*\/login/, {
    status: true,
    data: {
        username: 'testusername',
        nick: 'testusernick',
        head: 'http://placehold.it/60x60'
    }
});


Mock.mock(/http:\/\/.*\/friends/, [{
        username:"XiaoLi",
        nick:"李作明",
        head:" http://placehold.it/60x60"
    },{
        username:"XiaoBin",
        nick:"倪泽斌",
        head:"http://placehold.it/60x60"
    },{
        username:"XiaoWei",
        nick:"史徍伟",
        head:"http://placehold.it/60x60"
    },{
        username:"XiaoPeng",
        nick:"彭帅飞",
        head:"http://placehold.it/60x60"
    }]
    )


Mock.mock('http://localhost:9000/helloword/search', [{
        username:"XiaoLi",
        nick:"李作明",
        head:" http://placehold.it/60x60"
    },{
        username:"XiaoBin",
        nick:"倪泽斌",
        head:"http://placehold.it/60x60"
    },{
        username:"XiaoLi",
        nick:"李作明",
        head:" http://placehold.it/60x60"
    },{
        username:"XiaoBin",
        nick:"倪泽斌",
        head:"http://placehold.it/60x60"
    },{
        username:"XiaoLi",
        nick:"李作明",
        head:" http://placehold.it/60x60"
    },{
        username:"XiaoBin",
        nick:"倪泽斌",
        head:"http://placehold.it/60x60"
    },{
        username:"XiaoLi",
        nick:"李作明",
        head:" http://placehold.it/60x60"
    },{
        username:"XiaoBin",
        nick:"倪泽斌",
        head:"http://placehold.it/60x60"
    },{
        username:"XiaoLi",
        nick:"李作明",
        head:" http://placehold.it/60x60"
    },{
        username:"XiaoBin",
        nick:"倪泽斌",
        head:"http://placehold.it/60x60"
    },{
        username:"XiaoLi",
        nick:"李作明",
        head:" http://placehold.it/60x60"
    },{
        username:"XiaoBin",
        nick:"倪泽斌",
        head:"http://placehold.it/60x60"
    },]
    )