const treeData = [
    {
        "name": "Top Level",
        "parent": "null",
        "children": [
            {
                "name": "Level 2: A",
                "parent": "Top Level",
                "children": [
                    {
                        "name": "Son of A",
                        "parent": "Level 2: A",
                        "children": [
                            {
                                "name": "Grandson",
                                "parent": "Son of A"
                            }
                        ]
                    },
                    {
                        "name": "Daughter of A",
                        "parent": "Level 2: A"
                    }
                ]
            },
            {
                "name": "Level 2: B",
                "parent": "Top Level"
            },
            {
                "name": "Level 2: C",
                "parent": "Top Level"
            }
        ]
    }
];