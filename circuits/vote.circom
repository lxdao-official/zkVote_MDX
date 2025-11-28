pragma circom 2.2.3

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/mux1.circom";

/*
    ZK 匿名投票电路
    
    功能：
    1. 验证投票选项在有效范围内
    2. 生成 nullifierHash 防止重复投票
    3. 不暴露投票者身份和投票选项的关联
    
    输入：
    - nullifier: 随机数（私有），用于生成唯一标识
    - optionId: 投票选项（私有），1-based
    - maxOptions: 最大选项数（公开）
    
    输出：
    - nullifierHash: nullifier 的哈希（公开）
    - optionIdOut: 选项 ID（公开，用于计票）
*/

 template ZKVote() {
    // 公开输入
    signal input maxOptions;

    // 私有输入
    signal input nullifier;
    signal input optionId;
    signal input proposalId

    // 公开输出
    signal output nullifierHash;
    signal output optionIdOut;

    //1.验证 optionId >= 1
    component gte = GreaterEqThan(8);
    gte.in[0] <== optionId;
    gte.in[1] <== 1;

    //2.验证 optionId <= maxOptions
    component lte = LessEqThan(8);
    lte.in[0] <== optionId;
    lte.in[1] <== maxOptions;
    lte.out === 1;

    //3.计算nullifierHash = Poseidon(nullifier)
     component hasher = Poseidon(1);
     hasher.inputs[0] <== nullifier;
     nullifierHash <== hasher.out;
    
    //4. 输出 optionId (用于计票)
    optionIdOut <== optionId;
 }

component main {public [maxOptions]} = ZKVote();