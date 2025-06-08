import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { X } from 'lucide-react-native';
import { router } from 'expo-router';

export default function AboutScreen() {
  const handleBack = () => {
    router.back();
  };

  return (
    <ImageBackground
      source={require('../../assets/images/paper_background.jpg')}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.backButton}>
            <TouchableOpacity onPress={handleBack} style={styles.touchable} />
            <ArrowLeft color="#fff" size={24} />
          </View>
          <Text style={styles.title}>About</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.licenseContainer}>
            <Text style={styles.srdNotice}>
              The Systems Reference Document (SRD 5.1) is released under the Creative Commons Attribution 4.0 International License (CC BY 4.0)
            </Text>

            <View style={styles.separator} />

            <Text style={styles.licenseTitle}>
              Creative Commons Attribution 4.0 International License
            </Text>

            <Text style={styles.licenseText}>
              By exercising the Licensed Rights (defined below), You accept and agree to be bound by the terms and conditions of this Creative Commons Attribution 4.0 International Public License ("Public License"). To the extent this Public License may be interpreted as a contract, You are granted the Licensed Rights in consideration of Your acceptance of these terms and conditions, and the Licensor grants You such rights in consideration of benefits the Licensor receives from making the Licensed Material available under these terms and conditions.
            </Text>

            <Text style={styles.sectionTitle}>Section 1 – Definitions.</Text>
            
            <Text style={styles.licenseText}>
              <Text style={styles.bold}>a. Adapted Material</Text> means material subject to Copyright and Similar Rights that is derived from or based upon the Licensed Material and in which the Licensed Material is translated, altered, arranged, transformed, or otherwise modified in a manner requiring permission under the Copyright and Similar Rights held by the Licensor. For purposes of this Public License, where the Licensed Material is a musical work, performance, or sound recording, Adapted Material is always produced where the Licensed Material is synched in timed relation with a moving image.
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>b. Adapter's License</Text> means the license You apply to Your Copyright and Similar Rights in Your contributions to Adapted Material in accordance with the terms and conditions of this Public License.
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>c. Copyright and Similar Rights</Text> means copyright and/or similar rights closely related to copyright including, without limitation, performance, broadcast, sound recording, and Sui Generis Database Rights, without regard to how the rights are labeled or categorized. For purposes of this Public License, the rights specified in Section 2(b)(1)-(2) are not Copyright and Similar Rights.
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>d. Effective Technological Measures</Text> means those measures that, in the absence of proper authority, may not be circumvented under laws fulfilling obligations under Article 11 of the WIPO Copyright Treaty adopted on December 20, 1996, and/or similar international agreements.
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>e. Exceptions and Limitations</Text> means fair use, fair dealing, and/or any other exception or limitation to Copyright and Similar Rights that applies to Your use of the Licensed Material.
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>f. Licensed Material</Text> means the artistic or literary work, database, or other material to which the Licensor applied this Public License.
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>g. Licensed Rights</Text> means the rights granted to You subject to the terms and conditions of this Public License, which are limited to all Copyright and Similar Rights that apply to Your use of the Licensed Material and that the Licensor has authority to license.
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>h. Licensor</Text> means the individual(s) or entity(ies) granting rights under this Public License.
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>i. Share</Text> means to provide material to the public by any means or process that requires permission under the Licensed Rights, such as reproduction, public display, public performance, distribution, dissemination, communication, or importation, and to make material available to the public including in ways that members of the public may access the material from a place and at a time individually chosen by them.
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>j. Sui Generis Database Rights</Text> means rights other than copyright resulting from Directive 96/9/EC of the European Parliament and of the Council of 11 March 1996 on the legal protection of databases, as amended and/or succeeded, as well as other essentially equivalent rights anywhere in the world.
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>k. You</Text> means the individual or entity exercising the Licensed Rights under this Public License. Your has a corresponding meaning.
            </Text>

            <Text style={styles.sectionTitle}>Section 2 – Scope.</Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>a. License grant.</Text>
            </Text>

            <Text style={styles.licenseText}>
              1. Subject to the terms and conditions of this Public License, the Licensor hereby grants You a worldwide, royalty-free, non-sublicensable, non-exclusive, irrevocable license to exercise the Licensed Rights in the Licensed Material to:
            </Text>

            <Text style={styles.licenseText}>
              A. reproduce and Share the Licensed Material, in whole or in part; and
            </Text>

            <Text style={styles.licenseText}>
              B. produce, reproduce, and Share Adapted Material.
            </Text>

            <Text style={styles.licenseText}>
              2. Exceptions and Limitations. For the avoidance of doubt, where Exceptions and Limitations apply to Your use, this Public License does not apply, and You do not need to comply with its terms and conditions.
            </Text>

            <Text style={styles.licenseText}>
              3. Term. The term of this Public License is specified in Section 6(a).
            </Text>

            <Text style={styles.licenseText}>
              4. Media and formats; technical modifications allowed. The Licensor authorizes You to exercise the Licensed Rights in all media and formats whether now known or hereafter created, and to make technical modifications necessary to do so. The Licensor waives and/or agrees not to assert any right or authority to forbid You from making technical modifications necessary to exercise the Licensed Rights, including technical modifications necessary to circumvent Effective Technological Measures. For purposes of this Public License, simply making modifications authorized by this Section 2(a)(4) never produces Adapted Material.
            </Text>

            <Text style={styles.licenseText}>
              5. Downstream recipients.
            </Text>

            <Text style={styles.licenseText}>
              A. Offer from the Licensor – Licensed Material. Every recipient of the Licensed Material automatically receives an offer from the Licensor to exercise the Licensed Rights under the terms and conditions of this Public License.
            </Text>

            <Text style={styles.licenseText}>
              B. No downstream restrictions. You may not offer or impose any additional or different terms or conditions on, or apply any Effective Technological Measures to, the Licensed Material if doing so restricts exercise of the Licensed Rights by any recipient of the Licensed Material.
            </Text>

            <Text style={styles.licenseText}>
              6. No endorsement. Nothing in this Public License constitutes or may be construed as permission to assert or imply that You are, or that Your use of the Licensed Material is, connected with, or sponsored, endorsed, or granted official status by, the Licensor or others designated to receive attribution as provided in Section 3(a)(1)(A)(i).
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>b. Other rights.</Text>
            </Text>

            <Text style={styles.licenseText}>
              1. Moral rights, such as the right of integrity, are not licensed under this Public License, nor are publicity, privacy, and/or other similar personality rights; however, to the extent possible, the Licensor waives and/or agrees not to assert any such rights held by the Licensor to the limited extent necessary to allow You to exercise the Licensed Rights, but not otherwise.
            </Text>

            <Text style={styles.licenseText}>
              2. Patent and trademark rights are not licensed under this Public License.
            </Text>

            <Text style={styles.licenseText}>
              3. To the extent possible, the Licensor waives any right to collect royalties from You for the exercise of the Licensed Rights, whether directly or through a collecting society under any voluntary or waivable statutory or compulsory licensing scheme. In all other cases the Licensor expressly reserves any right to collect such royalties.
            </Text>

            <Text style={styles.sectionTitle}>Section 3 – License Conditions.</Text>

            <Text style={styles.licenseText}>
              Your exercise of the Licensed Rights is expressly made subject to the following conditions.
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>a. Attribution.</Text>
            </Text>

            <Text style={styles.licenseText}>
              1. If You Share the Licensed Material (including in modified form), You must:
            </Text>

            <Text style={styles.licenseText}>
              A. retain the following if it is supplied by the Licensor with the Licensed Material:
            </Text>

            <Text style={styles.licenseText}>
              i. identification of the creator(s) of the Licensed Material and any others designated to receive attribution, in any reasonable manner requested by the Licensor (including by pseudonym if designated);
            </Text>

            <Text style={styles.licenseText}>
              ii. a copyright notice;
            </Text>

            <Text style={styles.licenseText}>
              iii. a notice that refers to this Public License;
            </Text>

            <Text style={styles.licenseText}>
              iv. a notice that refers to the disclaimer of warranties;
            </Text>

            <Text style={styles.licenseText}>
              v. a URI or hyperlink to the Licensed Material to the extent reasonably practicable;
            </Text>

            <Text style={styles.licenseText}>
              B. indicate if You modified the Licensed Material and retain an indication of any previous modifications; and
            </Text>

            <Text style={styles.licenseText}>
              C. indicate the Licensed Material is licensed under this Public License, and include the text of, or the URI or hyperlink to, this Public License.
            </Text>

            <Text style={styles.licenseText}>
              2. You may satisfy the conditions in Section 3(a)(1) in any reasonable manner based on the medium, means, and context in which You Share the Licensed Material. For example, it may be reasonable to satisfy the conditions by providing a URI or hyperlink to a resource that includes the required information.
            </Text>

            <Text style={styles.licenseText}>
              3. If requested by the Licensor, You must remove any of the information required by Section 3(a)(1)(A) to the extent reasonably practicable.
            </Text>

            <Text style={styles.licenseText}>
              4. If You Share Adapted Material You produce, the Adapter's License You apply must not prevent recipients of the Adapted Material from complying with this Public License.
            </Text>

            <Text style={styles.sectionTitle}>Section 4 – Sui Generis Database Rights.</Text>

            <Text style={styles.licenseText}>
              Where the Licensed Rights include Sui Generis Database Rights that apply to Your use of the Licensed Material:
            </Text>

            <Text style={styles.licenseText}>
              a. for the avoidance of doubt, Section 2(a)(1) grants You the right to extract, reuse, reproduce, and Share all or a substantial portion of the contents of the database;
            </Text>

            <Text style={styles.licenseText}>
              b. if You include all or a substantial portion of the database contents in a database in which You have Sui Generis Database Rights, then the database in which You have Sui Generis Database Rights (but not its individual contents) is Adapted Material; and
            </Text>

            <Text style={styles.licenseText}>
              c. You must comply with the conditions in Section 3(a) if You Share all or a substantial portion of the contents of the database.
            </Text>

            <Text style={styles.licenseText}>
              For the avoidance of doubt, this Section 4 supplements and does not replace Your obligations under this Public License where the Licensed Rights include other Copyright and Similar Rights.
            </Text>

            <Text style={styles.sectionTitle}>Section 5 – Disclaimer of Warranties and Limitation of Liability.</Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>a. UNLESS OTHERWISE SEPARATELY UNDERTAKEN BY THE LICENSOR, TO THE EXTENT POSSIBLE, THE LICENSOR OFFERS THE LICENSED MATERIAL AS-IS AND AS-AVAILABLE, AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE LICENSED MATERIAL, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHER. THIS INCLUDES, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OR ABSENCE OF ERRORS, WHETHER OR NOT KNOWN OR DISCOVERABLE. WHERE DISCLAIMERS OF WARRANTIES ARE NOT ALLOWED IN FULL OR IN PART, THIS DISCLAIMER MAY NOT APPLY TO YOU.</Text>
            </Text>

            <Text style={styles.licenseText}>
              <Text style={styles.bold}>b. TO THE EXTENT POSSIBLE, IN NO EVENT WILL THE LICENSOR BE LIABLE TO YOU ON ANY LEGAL THEORY (INCLUDING, WITHOUT LIMITATION, NEGLIGENCE) OR OTHERWISE FOR ANY DIRECT, SPECIAL, INDIRECT, INCIDENTAL, CONSEQUENTIAL, PUNITIVE, EXEMPLARY, OR OTHER LOSSES, COSTS, EXPENSES, OR DAMAGES ARISING OUT OF THIS PUBLIC LICENSE OR USE OF THE LICENSED MATERIAL, EVEN IF THE LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH LOSSES, COSTS, EXPENSES, OR DAMAGES. WHERE A LIMITATION OF LIABILITY IS NOT ALLOWED IN FULL OR IN PART, THIS LIMITATION MAY NOT APPLY TO YOU.</Text>
            </Text>

            <Text style={styles.licenseText}>
              c. The disclaimer of warranties and limitation of liability provided above shall be interpreted in a manner that, to the extent possible, most closely approximates an absolute disclaimer and waiver of all liability.
            </Text>

            <Text style={styles.sectionTitle}>Section 6 – Term and Termination.</Text>

            <Text style={styles.licenseText}>
              a. This Public License applies for the term of the Copyright and Similar Rights licensed here. However, if You fail to comply with this Public License, then Your rights under this Public License terminate automatically.
            </Text>

            <Text style={styles.licenseText}>
              b. Where Your right to use the Licensed Material has terminated under Section 6(a), it reinstates:
            </Text>

            <Text style={styles.licenseText}>
              1. automatically as of the date the violation is cured, provided it is cured within 30 days of Your discovery of the violation; or
            </Text>

            <Text style={styles.licenseText}>
              2. upon express reinstatement by the Licensor.
            </Text>

            <Text style={styles.licenseText}>
              For the avoidance of doubt, this Section 6(b) does not affect any right the Licensor may have to seek remedies for Your violations of this Public License.
            </Text>

            <Text style={styles.licenseText}>
              c. For the avoidance of doubt, the Licensor may also offer the Licensed Material under separate terms or conditions or stop distributing the Licensed Material at any time; however, doing so will not terminate this Public License.
            </Text>

            <Text style={styles.licenseText}>
              d. Sections 1, 5, 6, 7, and 8 survive termination of this Public License.
            </Text>

            <Text style={styles.sectionTitle}>Section 7 – Other Terms and Conditions.</Text>

            <Text style={styles.licenseText}>
              a. The Licensor shall not be bound by any additional or different terms or conditions communicated by You unless expressly agreed.
            </Text>

            <Text style={styles.licenseText}>
              b. Any arrangements, understandings, or agreements regarding the Licensed Material not stated herein are separate from and independent of the terms and conditions of this Public License.
            </Text>

            <Text style={styles.sectionTitle}>Section 8 – Interpretation.</Text>

            <Text style={styles.licenseText}>
              a. For the avoidance of doubt, this Public License does not, and shall not be interpreted to, reduce, limit, restrict, or impose conditions on any use of the Licensed Material that could lawfully be made without permission under this Public License.
            </Text>

            <Text style={styles.licenseText}>
              b. To the extent possible, if any provision of this Public License is deemed unenforceable, it shall be automatically reformed to the minimum extent necessary to make it enforceable. If the provision cannot be reformed, it shall be severed from this Public License without affecting the enforceability of the remaining terms and conditions.
            </Text>

            <Text style={styles.licenseText}>
              c. No term or condition of this Public License will be waived and no failure to comply consented to unless expressly agreed to by the Licensor.
            </Text>

            <Text style={styles.licenseText}>
              d. Nothing in this Public License constitutes or may be interpreted as a limitation upon, or waiver of, any privileges and immunities that apply to the Licensor or You, including from the legal processes of any jurisdiction or authority.
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Creative Commons is not a party to its public licenses. Notwithstanding, Creative Commons may elect to apply one of its public licenses to material it publishes and in those instances will be considered the "Licensor." The text of the Creative Commons public licenses is dedicated to the public domain under the CC0 Public Domain Dedication. Except for the limited purpose of indicating that material is shared under a Creative Commons public license or as otherwise permitted by the Creative Commons policies published at creativecommons.org/policies, Creative Commons does not authorize the use of the trademark "Creative Commons" or any other trademark or logo of Creative Commons without its prior written consent including, without limitation, in connection with any unauthorized modifications to any of its public licenses or any other arrangements, understandings, or agreements concerning use of licensed material. For the avoidance of doubt, this paragraph does not form part of the public licenses.
              </Text>
              
              <Text style={styles.footerText}>
                Creative Commons may be contacted at creativecommons.org.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  licenseContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  srdNotice: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
    lineHeight: 26,
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
  licenseTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 12,
  },
  licenseText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2a2a2a',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'justify',
  },
  bold: {
    fontFamily: 'Inter-Bold',
  },
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'justify',
  },
});