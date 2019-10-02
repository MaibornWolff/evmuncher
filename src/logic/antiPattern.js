'use strict'
var ethOpcodes = require('./ethOpcodes')
/*
Checks for anti-pattern P1 - SWAPX SWAPX, where 1 <= X <= 16.
It can be removed. It saves 136 gas during deployment and 6 gas during execution

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p1 (position, opcodes, gasConsumed) {
  if (opcodes[position] >= 0x90 && opcodes[position] <= 0x9F) {
    if (opcodes[position + 1] >= 0x90 && opcodes[position + 1] <= 0x9F && opcodes[position] === opcodes[position + 1]) {
      gasConsumed['gasDeploy'] = 136
      gasConsumed['gasExecution'] = 6
      gasConsumed['deleteLength'] = 2
      gasConsumed['insert'] = []
      return true
    }
  }
  return false
}
/*
Checks for anti-pattern P2 - M consecutive jumpdests, where M >= 2.
One jumpdest is enough. It saves (M - 1) * 68 gas during deployment and (M - 1)
gas during execution

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/

function p2 (position, opcodes, gasConsumed) {
  var M = 1
  var opcode = opcodes[position]
  gasConsumed['pos'] = position
  position += 1
  while (opcode === 0x5B) {
    opcode = opcodes[position]
    if (opcode === 0x5B) {
      M += 1
      position += 1
    }
  }
  if (M >= 2) {
    gasConsumed['gasDeploy'] += ((M - 1) * 68)
    gasConsumed['gasExecution'] += (M - 1)
    gasConsumed['deleteLength'] = (M - 1)
    gasConsumed['insert'] = []
    return true
  }
  return false
}
/*
Checks for anti-pattern P3 - OP, pop, where OP from {iszero, not, balance,
  calldataload, extcodesize, blockhash, mload, sload}.
OP, pop can be replaced by pop.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p3 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  if (opcode === 0x15 || opcode === 0x19 || opcode === 0x31 || opcode === 0x35 ||
    opcode === 0x3B || opcode === 0x40 || opcode === 0x51 || opcode === 0x54) {
    if (opcodes[position + 1] === 0x50) {
      gasConsumed['gasDeploy'] += 68
      gasConsumed['pos'] = position
      gasConsumed['gasExecution'] += ethOpcodes.opcodes[opcode][1]
      gasConsumed['deleteLength'] = 1
      gasConsumed['insert'] = []
      return true
    }
  }
  return false
}
/*
Checks for anti-pattern P4 - OP, pop, where OP from {add, sub, mul, div, sdiv,
  mod, smod, exp, sigextnd, lt, gt, slt, sgt, eq, and, or, xor, byte, sha3}.
OP, pop can be replaced by pop, pop.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p4 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  if ((opcode >= 0x01 && opcode <= 0x07) ||
    opcode === 0x0A ||
    opcode === 0x0B ||
    opcode === 0x35 ||
    (opcode >= 0x10 && opcode <= 0x14) ||
    (opcode >= 0x16 && opcode <= 0x18) ||
    opcode === 0x1A || opcode === 0x20) {
    if (opcodes[position + 1] === 0x50) {
      // the next opcode is a pop
      gasConsumed['pos'] = position
      gasConsumed['gasExecution'] += ethOpcodes.opcodes[opcode][1]
      gasConsumed['deleteLength'] = 1
      gasConsumed['insert'] = [0x50]
      return true
    }
  }
  return false
}
/*
Checks for anti-pattern P5 - OP, pop, where OP from {addmod, mulmod}.
OP, pop can be replaced by pop, pop, pop.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p5 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  if (opcode === 0x08 || opcode === 0x09) {
    if (opcodes[position + 1] === 0x50) {
      // is the next opcode a pop!
      gasConsumed['pos'] = position
      gasConsumed['gasExecution'] += 4
      // we add one more opcode, that's why we subtract
      gasConsumed['gasDeploy'] -= 68
      gasConsumed['deleteLength'] = 1
      gasConsumed['insert'] = [0x50, 0x50]
      return true
    }
  }
  return false
}
/*
Checks for anti-pattern P6 - OP, pop, where OP from {address, origin, caller,
callvalue, calldatasize, codesize, gasprice, coinbase, timestamp, number,
difficulty, gaslimit, pc, msize, gas}.
OP, pop can be deleted.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p6 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  if (opcode === 0x30 ||
    (opcode >= 0x32 && opcode <= 0x34) ||
    opcode === 0x36 ||
    opcode === 0x38 ||
    opcode === 0x3A ||
    (opcode >= 0x41 && opcode <= 0x45) ||
    (opcode >= 0x58 && opcode <= 0x5A)) {
    if (opcodes[position + 1] === 0x50) {
      // the next opcode is a pop!
      gasConsumed['pos'] = position
      gasConsumed['gasExecution'] += 4
      gasConsumed['gasDeploy'] += 136
      gasConsumed['deleteLength'] = 2
      gasConsumed['insert'] = []
      return true
    }
  }
  return false
}
/*
Checks for anti-pattern P7 - {swap1, swap(X), OP, dup(X), OP} , 2 <= X <= 15, OP
from {add, mul, and, or, xor}
OP, pop can be replaced by {dup2, swap(X+1), OP, OP}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p7 (position, opcodes, gasConsumed) {
  // take the second opcode
  var opcode = opcodes[position + 1]
  // swap1 && swapX
  if (opcodes[position] === 0x90 && opcode >= 0x91 && opcode <= 0x9E) {
    opcode = opcodes[position + 2]
    // check if OP at 2 and 4 are equal and if its and, mul, and, or, xor
    if (opcode === opcodes[position + 4] &&
      (opcode === 0x01 || opcode === 0x02 || opcode === 0x16 ||
        opcode === 0x17 || opcode === 0x18)) {
      opcode = opcodes[position + 3]
      // dupX
      if (opcode >= 0x81 && opcode <= 0x8E &&
        (opcode - 0x80) === (opcodes[position + 1] - 0x90)) {
        gasConsumed['pos'] = position
        gasConsumed['gasExecution'] += 3
        gasConsumed['gasDeploy'] += 68
        gasConsumed['deleteLength'] = 5
        gasConsumed['insert'] = [
          0x81,
          opcodes[position + 1] + 1,
          opcodes[position + 2],
          opcodes[position + 4]
        ]
        return true
      }
    }
  }
  return false
}
/*
Checks for anti-pattern P8 - {OP, stop} , where OP is not {jumpdest, jump,
jumpi} or an opcode chaning storage (I can think only of sstore).
OP, stop can be replaced by stop.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p8 (position, opcodes, gasConsumed) {
  // take the second opcode
  var opcode0 = opcodes[position]
  var opcode1 = opcodes[position + 1]
  // stop
  if (opcode1 === 0x00 &&
    (opcode0 !== 0x5B && (opcode0 <= 0x55 || opcode0 >= 0x57))) {
    gasConsumed['pos'] = position
    gasConsumed['gasDeploy'] += 68
    gasConsumed['gasExecution'] += ethOpcodes.opcodes[opcode0][1]
    gasConsumed['deleteLength'] = 1
    gasConsumed['insert'] = []
    return true
  }
  return false
}
/*
Checks for anti-pattern P9 - {swap(X), dup(X+1), swap(1)}, where 1 <= X <= 15.
It can be replaced with {dup(1), swap(X+1)}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p9 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  // swap(X)
  if (opcode >= 0x90 && opcode <= 0x9F) {
    // dup(X+1), swap(1)
    if (opcodes[position + 1] === (opcode - 0x10 + 0x01) &&
      opcodes[position + 2] === 0x90) {
      gasConsumed['pos'] = position
      gasConsumed['gasDeploy'] += 68
      gasConsumed['gasExecution'] += 3
      gasConsumed['deleteLength'] = 3
      gasConsumed['insert'] = [
        0x80,
        opcode + 1 // swap(X+1)
      ]
      return true
    }
  }
  return false
}
/*
Checks for anti-pattern P10 - {push(X), swap(Y), Y consecutive pops} where
1 <= X <= 32, 1 <= Y <= 16.
It can be replaced with {Y consecutive pops, push(X)}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p10 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  // push(X)?
  if (typeof opcode === 'object' && opcode[0] >= 0x60 && opcode[0] <= 0x7F) {
    opcode = opcodes[position + 1]
    // swap(Y)
    if (opcode >= 0x90 && opcode <= 0x9F) {
      var consecutive = opcode - 0x90 + 1
      var i = 0
      for (; i <= consecutive;) {
        // Count the POP instructions
        if (opcodes[position + 2 + i] === 0x50) {
          i++
        } else {
          break
        }
      }
      if (i === consecutive) {
        gasConsumed['pos'] = position
        gasConsumed['gasDeploy'] += 68
        gasConsumed['gasExecution'] += 3
        gasConsumed['deleteLength'] = 2 + i
        gasConsumed['insert'] = Array(i).fill(0x50)
        gasConsumed['insert'].push(opcodes[position])
        return true
      }
    }
  }
  return false
}
/*
Checks for anti-pattern P11 - {swap(X), X+1 consecutive pops} where
1 <= X <= 16.
It can be replaced with {X+1 consecutive pops}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p11 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  // swap(X)?
  if (opcode >= 0x90 && opcode <= 0x9F) {
    // we need + 2 because 0x90 = swap1 and 0x90 - 0x90 is zero. But the
    // anti pattern says X+1, so 1+1=2
    var consecutive = opcode - 0x90 + 2
    var i = 0
    for (; i <= consecutive;) {
      if (opcodes[position + i + 1] === 0x50) {
        i++
      } else {
        break
      }
    }
    if (i === consecutive) {
      gasConsumed['pos'] = position
      gasConsumed['gasDeploy'] += 68
      gasConsumed['gasExecution'] += 3
      gasConsumed['deleteLength'] = 1
      gasConsumed['insert'] = []
      return true
    }
  }
  return false
}
/*
Checks for anti-pattern P12 - {swap(X), swap(Y), Y consecutive pops} where
1 <= X <= 15, X < Y
It can be replaced with {X consecutive pops, swap(Y-X), (Y-X) consecutive pops}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p12 (position, opcodes, gasConsumed) {
  var opcode1 = opcodes[position]
  // we do not check for SWAP16, bc the second swap needs to be greater
  if (opcode1 >= 0x90 && opcode1 <= 0x9E) {
    var opcode2 = opcodes[position + 1]
    // swap(Y), where Y > X
    if (opcode2 > opcode1 && opcode2 <= 0x9F) {
      var consecutive = 0
      var opcode3 = opcodes[position + 2]
      // count the pops
      while (opcode3 === 0x50) {
        consecutive += 1
        opcode3 = opcodes[position + 2 + consecutive]
      }
      if (consecutive > 0) {
        gasConsumed['pos'] = position
        gasConsumed['gasDeploy'] += 68
        gasConsumed['gasExecution'] += 3
        var x = opcode1 - 0x90 + 1
        var y = opcode2 - 0x90 + 1
        gasConsumed['insert'] = Array(x).fill(0x50)
        // adding swap(Y-X). We add 0x89, since 0x90 is SWAP1 and need
        // to cover that one. E.g. 0x93 - 0x92 = 0x01
        // In order to become SWAP1, we add 0x89
        gasConsumed['insert'].push((opcode2 - opcode1 + 0x89))
        gasConsumed['insert'] = gasConsumed['insert'].concat(Array(opcode2 - opcode1).fill(0x50))
        gasConsumed['deleteLength'] = 2 + y
        return true
      }
    }
  }
  return false
}
/*
Checks for anti-pattern P13 - {X consecutive push(N)s, Y consecutive pops} where
1 <= N <= 32.
It can be replaced with {(X-Y) consecutive push(N)s, if X > Y;
    (Y-X) consecutive pops, otherwise}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p13 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  var x = 0
  var insertPush = []
  // push, push, push, pop, pop, pop, pop
  //         1    2(3)  1    2    3     4
  while (typeof opcode === 'object' && opcode[0] >= 0x60 && opcode[0] <= 0x7F) {
    insertPush.push(opcode)
    x += 1
    opcode = opcodes[position + x]
  }
  if (x === 0) {
    return false
  }
  var y = 0
  while (opcode === 0x50) {
    y += 1
    opcode = opcodes[position + x + y]
  }
  if (y > 0) {
    var z = (x > y ? y : x)
    gasConsumed['pos'] = position
    gasConsumed['gasDeploy'] += 136 * z // (68 * 2 * z)
    gasConsumed['gasExecution'] += 5 * z // (3 * z + 2 * z)
    if (x > y) {
      gasConsumed['deleteLength'] = x + y
      gasConsumed['insert'] = insertPush.slice(0, x - y)
    } else {
      gasConsumed['deleteLength'] = 2 * x
      gasConsumed['insert'] = []
    }
    return true
  }
  return false
}
/*
Checks for anti-pattern P14 - {X consecutive dup(N)s, Y consecutive pops} where
1 <= N <= 16.
It can be replaced with {(X-Y) consecutive dup(N)s, if X > Y;
    (Y-X) consecutive pops, otherwise}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p14 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  var x = 0
  var insertDup = []
  while (opcode >= 0x80 && opcode <= 0x8F) {
    insertDup.push(opcode)
    x += 1
    opcode = opcodes[position + x]
  }
  if (x === 0) {
    return false
  }
  var y = 0
  while (opcode === 0x50) {
    y += 1
    opcode = opcodes[position + x + y]
  }
  if (y > 0) {
    var z = (x > y ? y : x)
    gasConsumed['pos'] = position
    gasConsumed['gasDeploy'] += 136 * z
    gasConsumed['gasExecution'] += 5 * z
    if (x > y) {
      gasConsumed['deleteLength'] = x + y
      gasConsumed['insert'] = insertDup.slice(0, x - y)
    } else {
      gasConsumed['deleteLength'] = 2 * x
      gasConsumed['insert'] = []
    }
    return true
  }
  return false
}
/*
Checks for anti-pattern P15 - {dup(X), swap(X)} where 1 <= X <= 16
It can be replaced with {dup(X)}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p15 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  // dup(X)?
  if (opcode >= 0x80 && opcode <= 0x8F) {
    // swap(X) == dup(X)
    if (opcodes[position + 1] === (opcode + 0x10)) {
      gasConsumed['pos'] = position
      gasConsumed['gasDeploy'] += 68
      gasConsumed['gasExecution'] += 3
      gasConsumed['deleteLength'] = 2
      gasConsumed['insert'] = [opcode]
      return true
    }
  }
  return false
}
/*
Checks for anti-pattern P16 -
{swap1, swap2, …, swap(X), swap(X-1), …, swap1, X-1 consecutive pops} where
2 <= X <= 16.
It can be replaced with {X-1 consecutive pops, swap1}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p16 (position, opcodes, gasConsumed) {
  //        i0, i1, i2, i3
  // swap1: i1, i0, i2, i3
  // swap2: i2, i0, i1, i3
  // swap3: i3, i0, i1, i2
  // swap4:
  // swap3:
  // swap2: i1, i0, i3, i2
  // swap1: i0, i1, i3, i2
  // pop
  // pop
  // pop
  var opcode = opcodes[position]
  if (opcode === 0x90) {
    var x = 1
    opcode = opcodes[position + x]
    // counting upwards
    while (opcode === (0x90 + x)) {
      x += 1
      opcode = opcodes[position + x]
    }
    if (x < 2) {
      return false
    }
    // counting down
    var i = (x - 2)
    var tmp = x + 1
    for (; i >= 0; i--) {
      if (opcode !== (0x90 + i)) {
        break
      }
      opcode = opcodes[position + tmp++]
    }
    if (i > 0) {
      return false
    }
    for (var i1 = x - 1; i1 > 0; i1--) {
      if (opcode !== 0x50) {
        return false
      }
    }
    gasConsumed['pos'] = position
    gasConsumed['gasDeploy'] += 136 * (x - 1)
    gasConsumed['gasExecution'] += 6 * (x - 1)
    gasConsumed['deleteLength'] = 2 * x
    gasConsumed['insert'] = []
    return true
  }
  return false
}
/*
Checks for anti-pattern P17 - {swap1, OP} where OP ∈ {add, mul, and, or, xor}
It can be replaced with {OP}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p17 (position, opcodes, gasConsumed) {
  if (opcodes[position] === 0x90) {
    // get the OP
    var opcode = opcodes[position + 1]
    if (opcode === 0x01 || opcode === 0x02 || opcode === 0x16 ||
      opcode === 0x17 || opcode === 0x18) {
      gasConsumed['pos'] = position
      gasConsumed['gasDeploy'] += 68
      gasConsumed['gasExecution'] += 3
      gasConsumed['deleteLength'] = 1
      gasConsumed['insert'] = []
      return true
    }
  }
  return false
}
/*
Checks for anti-pattern P18 - {OP, iszero, iszero} where
OP ∈ {lt, gt, slt, sgt, eq}.
It can be replaced with {OP}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p18 (position, opcodes, gasConsumed) {
  // iszero?
  if (opcodes[position + 1] === opcodes[position + 2] && opcodes[position + 1] === 0x15) {
    var opcode = opcodes[position]
    if (opcode >= 0x10 && opcode <= 0x14) {
      gasConsumed['pos'] = position
      gasConsumed['gasDeploy'] += 136
      gasConsumed['gasExecution'] += 6
      gasConsumed['deleteLength'] = 3
      gasConsumed['insert'] = [opcode]
      return true
    }
  }
  return false
}
/*
Checks for anti-pattern P19 - {N consecutive push(X)，M consecutive swap(Y)}
where Y < N, 1 <= X <= 32, 1 <= Y <= 16.
It can be replaced with {N consecutive push(X)}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p19 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  var n = 0
  var m = 0
  var pushOpcodes = []
  gasConsumed['pos'] = position
  while (opcode >= 0x60 && opcode <= 0x7F) {
    pushOpcodes.push(opcode)
    n += 1
    position += 1
    opcode = opcodes[position]
  }
  // need to calculate the upper bound
  var upper = 0x90 + n - 1
  while (opcode >= 0x90 && opcode <= upper) {
    m += 1
    position += 1
    opcode = opcodes[position]
  }
  if (n > 0 && m > 0) {
    gasConsumed['gasDeploy'] += (m * 68)
    gasConsumed['gasExecution'] += (m * 3)
    gasConsumed['deleteLength'] = n + m
    gasConsumed['insert'] = pushOpcodes
    return true
  }
  return false
}
/*
Checks for anti-pattern P20 - {push(X), swap(Y), push(M), swap1} where
 1 <= X <= 32, 1 <= Y <= 15, 1 <= M <= 32.
It can be replaced with {push(M), push(X), swap(Y+1)}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p20 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  // push(X)
  if (typeof opcode === 'object' && opcode[0] >= 0x60 && opcode[0] <= 0x7F) {
    opcode = opcodes[position + 1]
    // swap(Y)
    if (opcode >= 0x90 && opcode <= 0x9E) {
      opcode = opcodes[position + 2]
      // push(M)
      if (typeof opcode === 'object' && opcode[0] >= 0x60 && opcode[0] <= 0x7F) {
        opcode = opcodes[position + 3]
        // swap1
        if (opcode === 0x90) {
          gasConsumed['pos'] = position
          gasConsumed['gasDeploy'] += 68
          gasConsumed['gasExecution'] += 3
          gasConsumed['deleteLength'] = 4
          gasConsumed['insert'] = [
            opcodes[position + 2],
            opcodes[position],
            opcodes[position + 1] + 1
          ]
          return true
        }
      }
    }
  }
  return false
}
/*
Checks for anti-pattern P21 - {consecutive X push(N), dup(Y), swap(Z)} where
 Y<=X, Z<=X, M<=X, 1 <= N <= 32, 1 <= Y <= 16, 1 <= Z <= 16, 1 <= M <= 16.
It can be replaced with {combination of X push(N) and dup(M)}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p21 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  var x = 0
  // counting the pushes
  while (opcode >= 0x60 && opcode <= 0x7F) {
    x += 1
    position += 1
    opcode = opcodes[position]
  }
  // have to make sure that Y <= X
  if (opcode >= 0x80 && opcode <= (0x80 + x - 1)) {
    position += 1
    opcode = opcodes[position]
    if (opcode >= 0x90 && opcode <= (0x90 + x - 1)) {
      gasConsumed['pos'] = position + 1
      gasConsumed['gasDeploy'] += 68
      gasConsumed['gasExecution'] += 3
      return true
    }
  }
  return false
}
/*
Checks for anti-pattern P22 -
{swap(N), M consecutive OPs，(N+M) consecutive and same OP'} where
 OP ∈ {push(X), dup(Y)},
 OP' ∈ {add, mul, and, or, xor}, 1 <= X <= 32, 1 <= N <= 16, 1 <= Y <= 16.
It can be replaced with {M consecutive OPs，(N+M) consecutive and same OP'}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p22 (position, opcodes, gasConsumed) {
  var opcode = opcodes[position]
  var m = 0
  gasConsumed['pos'] = position
  position += 1
  if (opcode >= 0x90 && opcode <= 0x9F) {
    var swap = opcode
    opcode = opcodes[position]
    // check for push and dup
    while ((typeof opcode === 'object' && opcode[0] >= 0x60 && opcode[0] <= 0x7F) ||
      (opcode >= 0x80 && opcode <= 0x8F)) {
      m += 1
      position += 1
      opcode = opcodes[position]
    }
    if (opcode === 0x01 || opcode === 0x02 || opcode === 0x16 ||
      opcode === 0x17 || opcode === 0x18) {
      var consecutive = 1
      var consecutiveOP = opcode
      position += 1
      opcode = opcodes[position]
      while (opcode === consecutiveOP) {
        consecutive += 1
        position += 1
        opcode = opcodes[position]
      }
      if ((consecutive + m) === (swap - 0x89)) {
        gasConsumed['gasDeploy'] += 68
        gasConsumed['gasExecution'] += 3
        gasConsumed['deleteLength'] = 1
        gasConsumed['insert'] = []
        return true
      }
    }
  }
  return false
}
/*
Checks for anti-pattern P23 - {dup1, swap(X), dup2, swap1} where 1 <= X <= 15.
It can be replaced with {dup1, dup2, swap(X+1)}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p23 (position, opcodes, gasConsumed) {
  var opcode1 = opcodes[position]
  var opcode2 = opcodes[position + 1]
  var opcode3 = opcodes[position + 2]
  var opcode4 = opcodes[position + 3]
  if (opcode1 === 0x80 && opcode2 >= 90 && opcode2 <= 0x9E &&
    opcode3 === 0x81 && opcode4 === 0x90) {
    gasConsumed['pos'] = position
    gasConsumed['gasDeploy'] += 68
    gasConsumed['gasExecution'] += 3
    gasConsumed['deleteLength'] = 4
    gasConsumed['insert'] = [
      opcode1,
      opcode3,
      opcode2 + 1
    ]
    return true
  }
  return false
}
/*
Checks for anti-pattern P24 - {dup(X), swap(X-1), swap1, dup(X), swap1} where
3 <= X <= 16.
It can be replaced with {dup(X), dup1, swap(X), swap2}.

\param: the position in the opcode stream
\param: array with the opcodes
\return: object with information if the anti-pattern has been found, the saved
gas and the next position in the opcode stream
*/
function p24 (position, opcodes, gasConsumed) {
  var opcode1 = opcodes[position]
  var opcode2 = opcodes[position + 1]
  var opcode3 = opcodes[position + 2]
  var opcode4 = opcodes[position + 3]
  var opcode5 = opcodes[position + 4]
  if (opcode1 === opcode4 && opcode1 >= 0x82 && opcode1 <= 0x8F &&
    opcode3 === opcode5 && opcode3 === 0x90) {
    // checking if swap(X-1), where X comes from dup(X)
    // e.g. opcode1 is dup(3) [0x82], so opcode2 should be 0x91
    // 0x90 + 0x82 - 0x81
    if (opcode2 === (0x90 + opcode1 - 0x81)) {
      gasConsumed['pos'] = position
      gasConsumed['gasDeploy'] += 68
      gasConsumed['gasExecution'] += 3
      gasConsumed['deleteLength'] = 5
      gasConsumed['insert'] = [
        opcode1,
        0x80,
        opcode2 + 1,
        0x81
      ]
      return true
    }
  }
  return false
}
export const pattern = {
  p1: p1,
  p2: p2,
  p3: p3,
  p4: p4,
  p5: p5,
  p6: p6,
  p7: p7,
  p8: p8,
  p9: p9,
  p10: p10,
  p11: p11,
  p12: p12,
  p13: p13,
  p14: p14,
  p15: p15,
  p16: p16,
  p17: p17,
  p18: p18,
  p19: p19,
  p20: p20,
  p21: p21,
  p22: p22,
  p23: p23,
  p24: p24
}
