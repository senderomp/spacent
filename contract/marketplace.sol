// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract Spacerent {
    uint256 internal spacesLength = 0;
    uint256 internal slotsLength = 0;
    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Space {
        address payable owner;
        string name;
        uint256 startIndex;
        uint256 endIndex;
        uint256[] daysAv;
        uint256[] slots;
        uint256 price;
    }

    struct Slot {
        address occupant;
        uint256 day;
        uint256 hour;
    }

    mapping(uint256 => Slot) internal slots;

    mapping(uint256 => Space) internal spaces;

    mapping(address => uint256[]) internal slotsReserved;

    function createSpace(
        string memory _name,
        uint256 _startIndex,
        uint256 _endIndex,
        uint256[] memory _days,
        uint256[] memory _slots,
        uint256 _price
    ) public {
        spaces[spacesLength] = Space(
            payable(msg.sender),
            _name,
            _startIndex,
            _endIndex,
            _days,
            _slots,
            _price
        );

        address empt;

        for (uint256 j = _startIndex; j < _endIndex; j++) {
            for (uint256 i = 0; i < _days.length; i++) {
                slots[slotsLength] = Slot(empt, _days[i], j);
                slotsLength++;
            }
        }
        spacesLength++;
    }

    function getSpace(uint256 _index)
        public
        view
        returns (
            address payable,
            string memory,
            uint256,
            uint256,
            uint256[] memory,
            uint256[] memory,
            uint256
        )
    {
        return (
            spaces[_index].owner,
            spaces[_index].name,
            spaces[_index].startIndex,
            spaces[_index].endIndex,
            spaces[_index].daysAv,
            spaces[_index].slots,
            spaces[_index].price
        );
    }

    function getSlot(uint256 _index)
        public
        view
        returns (
            address,
            uint256,
            uint256
        )
    {
        return (slots[_index].occupant, slots[_index].day, slots[_index].hour);
    }

    function reserveSlot(uint256 _index, uint256 _Sindex) public payable {
        require(
            slots[_index].occupant ==
                0x0000000000000000000000000000000000000000,
            "Reserved Slot"
        );
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                spaces[_index].owner,
                spaces[_index].price
            ),
            "Transfer failed."
        );
        slotsReserved[msg.sender].push(_Sindex);
        slots[_Sindex].occupant = msg.sender;
    }

    function getSpacesLength() public view returns (uint256) {
        return (spacesLength);
    }

    function getSlotsLength() public view returns (uint256) {
        return (slotsLength);
    }
}
