import {withRouter} from "react-router";
import {DashboardPage, DashboardQueryProcessor, processArchetypeData} from "./DashboardPage";
import {playerFromUrl} from "../utilities/utilities";
import {Layout} from "antd";
import Header from "../components/Header";
import MmrSelector from "../components/MmrSelector";
import TimeFrameSelector from "../components/TimeFrameSelector";
import React from "react";
import {TurnLevels} from "../components/DashItems/TurnLevels";


const processMinionData = (data) => {
    let minions = {};
    data.allBoards.forEach((item) => {
        if (item.gameRecord == null) return;

        for (let minion of item.minionSet) {
            let m = minion.name;

            if (!(m in minions))
                minions[m] = {
                    count: 0,
                    totalPos: 0,
                    gameList: [],
                };

            // only count minion once for each game
            if (minions[m].gameList.includes(item.gameRecord.id)) continue;

            minions[m].count++;
            minions[m].totalPos += item.gameRecord.position;
            minions[m].gameList.push(item.gameRecord.id);
        }

    });

    let result = Object.entries(minions).map((data) => {
            return {
                'minion': data[0],
                'count': data[1].count,
                'avg_position': (data[1].totalPos / data[1].count).toFixed(2)
            }
        }
    );

    result.sort((a, b) => {
        let pos = a.avg_position - b.avg_position;
        if (pos !== 0) return pos;
        return b.count - a.count;
    });

    return result;
};


class HeroPage extends DashboardPage {

    render() {
        let hero = decodeURI(this.props.match.params.hero);
        let queryParams = `dateTime:"${this.timeFrameToDate()}", hero:"${hero}"`;
        let player = this.props.match.params.player;
        if (player) queryParams += `, player:"${playerFromUrl(player)}"`;
        else queryParams += `, minMmr:${this.state.mmr[0]}, maxMmr:${this.state.mmr[1]}`;

        const data = {
            "dashboardItems": []
        };


        data.dashboardItems.push(TurnLevels);

        data.dashboardItems.push({
            "id": "minions",
            "layout": {"x": 0, "y": 8, "w": 4, "h": 10, "minW": 3},
            "query": "allBoards",
            "queryFields": {
                minionSet: ["name"],
                gameRecord: ["position", "id"]
            },
            "queryParams": queryParams + ', isSelf:true',
            "vizState": {
                "chartType": "table",
                processData: (data) => {
                    return {
                        columns: [
                            {
                                title: 'Minion Played',
                                dataIndex: 'minion',
                            }, {
                                title: 'Average Position',
                                dataIndex: 'avg_position',
                            }, {
                                title: 'Count',
                                dataIndex: 'count',
                            }
                        ],
                        data: processMinionData(data),
                        key: 'minion',
                    }
                }
            },
            "bodyStyle": {padding: 0},
            "name": "Top Minions",
            "__typename": "DashboardItem"
        });

        data.dashboardItems.push({
            "id": "archetypes",
            "layout": {"x": 4, "y": 8, "w": 4, "h": 10, "minW": 3},
            "query": "allGameRecords",
            "queryFields": {
                position: null,
                finalBoard: ["archetype"],
            },
            "queryParams": queryParams,
            "vizState": {
                "chartType": "table",
                processData: (data) => {
                    return {
                        columns: [
                            {
                                title: 'Archetype',
                                dataIndex: 'archetype',
                            }, {
                                title: 'Average Position',
                                dataIndex: 'avg_position',
                            }, {
                                title: 'Count',
                                dataIndex: 'count',
                            }
                        ],
                        data: processArchetypeData(data),
                        key: 'archetype',
                    }
                }
            },
            "bodyStyle": {padding: 0},
            "name": "Top Archetypes",
            "__typename": "DashboardItem"
        });

        return (
            <Layout style={{height: "100%"}}>
                <Header>
                    {!player &&
                    <MmrSelector mmr={this.state.mmr} updateMmr={this.setMmr} minMmrRange={3000} maxMmrRange={15000}/>}
                    <TimeFrameSelector timeFrame={this.state.timeFrame} setTimeFrame={this.setTimeFrame}/>
                </Header>
                <Layout.Content>
                    <h1 style={{margin: "0.5em 1em 0 1em"}}>{hero}</h1>
                    <DashboardQueryProcessor data={data} player={player} queryParams={queryParams}/>
                </Layout.Content>
            </Layout>
        );

    }

}

export default withRouter(HeroPage);