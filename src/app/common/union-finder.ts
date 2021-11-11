
export class UnionFinder {

    public static do(data, union = ['email', 'mobile', 'name']) {
        const groupHash = {};
        union.forEach((property) => {
            groupHash[property] = {};
        })
        const groupNodes = [];
        data.forEach((contact) => {

            const group = UnionFinder.makeset(contact.id);
            const groups = [];
            union.forEach((attr) => {
                if (groupHash[attr].hasOwnProperty(contact[attr])) {
                    if (contact[attr] !== null) { // only add if field has actual value
                        groups.push(groupHash[attr][contact[attr]]);
                    }
                }
            });

            groups.push(group);
            groupNodes.push(group);

            for (let i = 1; i < groups.length; i++) {
                UnionFinder.combine(groups[0], groups[i]);
            }

            union.forEach((attr) => {
                groupHash[attr][contact[attr]] = groups[0];
            });
        })

        const contactsInGroup = {};
        groupNodes.forEach((group) => {
            const groupId = UnionFinder._find(group).id;
            if (contactsInGroup.hasOwnProperty(groupId) === false) {
                contactsInGroup[groupId] = [];
            }
            contactsInGroup[groupId].push(group.id);
        });

        const result = Object.values(contactsInGroup).filter((list: Array<{}>) => {
            return list.length > 1;
        })

        return result;
    }

    private static _find(n) {
        if (n.parent === n) { return n; };
        n.parent = UnionFinder._find(n.parent);
        return n.parent;
    }

    private static makeset(id) {
        const newnode = {
            parent: null,
            id: id,
            rank: 0
        };
        newnode.parent = newnode;
        return newnode;
    }

    private static combine(n1, n2) {
        const n11 = UnionFinder._find(n1);
        const n22 = UnionFinder._find(n2);

        if (n11 === n22) { return };

        if (n11.rank < n22.rank) {
            n22.parent = n22;
            return n22;
        } else if (n22.rank < n11.rank) {
            n22.parent = n11;
            return n11;
        } else {
            n22.parent = n11;
            n11.rank += 1;
            return n11;
        }
    }
}
