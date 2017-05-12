            <PasswordGesture
              ref='gestures'
              type={type}
              message={this.message}
              status={this.status}
              style={styles.style}
              textStyle={styles.textStyle}
              normalColor="red"
              rightColor="#ffba00"
              wrongColor="#ff5907"
              onStart={() => this.onStart()}
              onEnd={pwd => this.onEnd(pwd)} />


https://github.com/Spikef/react-native-gesture-password