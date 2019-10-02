'use strict'
// let pattern = require('./antiPattern')
import { pattern } from './antiPattern'
// import { w3Component } from './web3Component'

export const ethMain = function codeAnalysis (code, rounds) {
  // console.log('Old Code', code)
  let opcodeList = splitCode(code)
  let gasConsumed = identifyAntiPatterns(opcodeList, rounds)
  let newCode = stickCodeTogether(opcodeList)
  // console.log('New Code: ', newCode)
  return {
    'gasDeploy': gasConsumed['gasDeploy'],
    'gasExecution': gasConsumed['gasExecution'],
    'newCode': newCode
  }
}

/*
splitCode takes a smart contract code (string) and splits that code based on
opcodes. For the push opcode, the parameter, which follows the opcode in the
string, is removed.

\param: The smart contract code as string
\return: a number array which contains the opcodes
*/
function splitCode (code) {
  // code = '0x9090915b5b1950315035503B5040505150545001500250035004500550065007500A500B50105011501250135014501650175018501A502050085009503050325033503450365038503A5041504250435044504550585059505A50909101810101009182906188889250505091505050919250505061FFFF61FFFF5050505061FFFF61FFFF61FFFF61FFFF61FFFF61FFFF5050505080815050508191819290919293929190505050900110151560FF9161FFFF9080918190839290839063FFFFFFFF63FFFFFFFF919192818181010101010101'
  // code = '0x60FF61EEEE62DDDDDD5050'
  let opcode, jump
  let splittedCode = []
  let end
  // we start from index 2 to remove the leading 0x
  for (var i = 2; i < code.length;) {
    opcode = parseInt(code.substring(i, i + 2), 16)
    if (opcode >= 0x60 && opcode <= 0x7F) {
      end = (opcode - 0x60 + 2) * 2
      splittedCode.push([opcode, code.substring(i + 2, i + end)])
      jump = (opcode - 0x60 + 2) * 2
    } else {
      // so far no other code has its input within the code
      splittedCode.push(opcode)
      jump = 2
    }
    i += jump
  }
  return splittedCode
}
/**
identifyAntiPatterns takes a list of opcodes and checks for anti-patterns as
described in 'Towards saving money in using smart contracts' by Ting Chen

\param: Opcodes in a number array

*/
function identifyAntiPatterns (opcodes, rounds) {
  var gasConsumed = {
    'gasDeploy': 0,
    'gasExecution': 0,
    'pos': 0
  }
  let patternFound = true
  while (patternFound) {
    patternFound = false
    for (var pos = 0; pos < opcodes.length;) {
      if (pattern.p1(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p2(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p3(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p4(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p5(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p6(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p7(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p8(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p9(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p10(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p11(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p12(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p13(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p14(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p15(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p16(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p17(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p18(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p20(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p22(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p23(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      if (pattern.p24(pos, opcodes, gasConsumed)) {
        replaceCode(pos, opcodes, gasConsumed)
        patternFound = true
      }
      pos += 1
    }
  }
  return {
    'gasDeploy': gasConsumed['gasDeploy'],
    'gasExecution': gasConsumed['gasExecution']
  }
}
/**
 * Receives a position of a antipattern location in the opcode list and replaces
 * it with the given pattern in the gasConsumed object.
 * @param {*} pos Position of anti pattern in opcode list
 * @param {*} opcodes The opcodes list
 * @param {*} gasConsumed Object with replace pattern and how much of gas
 * could be saved
 */
function replaceCode (pos, opcodes, gasConsumed) {
  let insertOpcodes = gasConsumed['insert']
  let insertLenght = insertOpcodes.length
  opcodes.splice(gasConsumed['pos'], gasConsumed['deleteLength'])
  if (insertLenght >= 0) {
    // since there is nothing to replace, we just delete the number of opcodes
    for (var i = 0; i < insertLenght; i++) {
      // inject the opcodes to make it more efficient
      opcodes.splice(pos + i, 0, insertOpcodes[i])
    }
  }
}

function stickCodeTogether (opcodes) {
  let code = '0x'
  let opcode
  for (let i = 0; i < opcodes.length; i++) {
    opcode = opcodes[i]
    if (typeof opcode === 'object') {
      code = code.concat(opcode[0].toString(16))
      code = code.concat(opcode[1].toString(16))
    } else {
      code = code.concat(opcode.toString(16))
    }
  }
  return code
}
